import express from 'express';
import cors from 'cors';
import ytdl from '@distube/ytdl-core';
import { createWriteStream, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

const app = express();
const port = 3000;

// Enable CORS
app.use(cors());

// Directory to store downloaded audio files
const audioDirectory = './src/assets/audio';

// Maximum video duration in seconds (15 minutes)
const MAX_DURATION_SECONDS = 15 * 60;

// Function to generate a unique filename based on the YouTube URL
function generateFileName(url: string): string {
    const hash = createHash('md5').update(url).digest('hex');
    return `audio_${hash}.webm`;
}

// Function to get video info including duration
async function getVideoInfo(url: string): Promise<{duration: number, title: string}> {
    try {
        const info = await ytdl.getInfo(url);
        const durationSeconds = parseInt(info.videoDetails.lengthSeconds);
        const title = info.videoDetails.title;
        return { duration: durationSeconds, title };
    } catch (error) {
        console.error('Error getting video info:', error);
        throw new Error(`Failed to get video info: ${error}`);
    }
}

// Function to download audio from YouTube
async function downloadFromURL(url: string): Promise<string> {
    // Check if the video is too long
    const info = await getVideoInfo(url);
    if (info.duration > MAX_DURATION_SECONDS) {
        throw new Error(`Video duration (${Math.floor(info.duration / 60)}:${info.duration % 60}) exceeds maximum allowed (15:00)`);
    }
    
    // Create the output directory if it doesn't exist
    if (!existsSync(audioDirectory)) {
        mkdirSync(audioDirectory);
    }
    
    // Generate the filename and full output path
    const fileName = generateFileName(url);
    const outputPath = join(audioDirectory, fileName);
    
    // Check if the file already exists
    if (existsSync(outputPath)) {
        console.log(`File for URL ${url} already exists at: ${outputPath}`);
        return outputPath;
    }
    
    console.log(`Downloading audio from ${url} (${info.title})...`);
    
    const stream = ytdl(url, { filter: 'audioonly' });
    const file = createWriteStream(outputPath);
    
    return new Promise((resolve, reject) => {
        stream.pipe(file);
        
        let lastPercent = 0;
        
        stream.on('progress', (chunkLength, downloadedBytes, totalBytes) => {
            // Only update if totalBytes is valid and non-zero
            if (totalBytes && totalBytes > 0) {
                const percent = Math.min((downloadedBytes / totalBytes) * 100, 100);
                
                // Only log if the percentage has changed significantly to avoid console spam
                if (percent - lastPercent >= 5 || percent === 100) {
                    lastPercent = percent;
                    if(percent === 200) {
                        stream.destroy();
                        resolve(outputPath);
                        return;
                    }
                    console.log(`Download progress: ${percent.toFixed(2)}%`);
                }
            } else {
                // If we don't have valid totalBytes, just log the downloaded bytes
                console.log(`Downloaded ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB`);
            }
        });
        
        stream.on('end', () => {
            console.log(`Download complete! Audio saved as "${outputPath}"`);
            resolve(outputPath);
        });
        
        stream.on('error', (error) => {
            console.error('Download error:', error);
            reject(error);
        });
        
        file.on('error', (error) => {
            console.error('File write error:', error);
            reject(error);
        });
    });
}

// Serve the downloaded audio files
app.get('/audio/:filename', (req, res) => {
    const { filename } = req.params;
    const filePath = join(audioDirectory, filename);
    
    // Check if the file exists
    if (!existsSync(filePath)) {
        return res.status(404).send('File not found');
    }
    
    // Read the audio file and return it in the response
    const fileBuffer = readFileSync(filePath);
    return res.status(200).contentType('audio/webm').send(fileBuffer);
});

// Download audio from YouTube via POST request
app.post('/download', express.json(), async (req, res) => {
    try {
        const { url } = req.body;
        if (!url || typeof url !== 'string') {
            return res.status(400).send('Invalid URL');
        }
        
        // Get video info to check duration before downloading
        const videoInfo = await getVideoInfo(url);
        
        // Check if the video is too long
        if (videoInfo.duration > MAX_DURATION_SECONDS) {
            return res.status(400).json({
                error: 'Video too long',
                message: `Video duration (${Math.floor(videoInfo.duration / 60)}:${String(videoInfo.duration % 60).padStart(2, '0')}) exceeds maximum allowed (15:00)`,
                duration: videoInfo.duration
            });
        }
        
        // Proceed with download
        const filePath = await downloadFromURL(url);
        const fileName = generateFileName(url);
        
        return res.status(200).json({ 
            filePath,
            fileName,
            url: `/audio/${fileName}`,
            title: videoInfo.title,
            duration: videoInfo.duration
        });
    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({
            error: 'Internal Server Error',
            message: error.message || 'Unknown error occurred'
        });
    }
});

// Start the Express server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});