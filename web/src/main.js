import { createApp } from 'vue'
import App from './App.vue'

import './assets/main.css'
import { createManager } from '@vue-youtube/core';

const app = createApp(App).use(createManager());
app.config.errorHandler = (err, vm, info) => {
    mp.trigger('log', err)
    console.error("Error:", err);
    console.error("Vue component:", vm);
    console.error("Additional info:", info);
};

app.mount('#app')
