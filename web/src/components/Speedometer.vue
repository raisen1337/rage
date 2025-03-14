<script setup>
const icons = import.meta.glob('@/assets/images/*.{png,jpg,svg}', { eager: true });
const itemIcons = Object.entries(icons).map(([path, mod]) => ({
    name: path.split('/').pop()?.replace(/\.(png|jpg|svg)$/, ''),
    src: (mod).default,
}));

function getIconByName(name) {
	return itemIcons.find((icon) => icon.name === name)?.src;
}



var s_playerID;
var s_rpm;
var s_speed;
var s_gear;
var s_IL;
var s_Handbrake;
var s_LS_r;
var s_LS_o;
var s_LS_h;
var calcSpeed;
var speedText = '';
var inVehicle = false;

mp.events.add("updateSpeedometer", (data) => {
	data = JSON.parse(data);
	s_rpm = data.rpm;
	s_speed = data.speed;
	s_gear = data.gear;
	calcSpeed = Math.round(s_speed * 3.6);
	if (calcSpeed < 100) {
		speedText = '0' + calcSpeed;
		if (calcSpeed < 10) {
			speedText = '00' + calcSpeed;
		}
	} else {
		speedText = calcSpeed;
	}

	// $("#rpmshow").attr("data-value", s_rpm.toFixed(2));
	document.querySelector('#rpmshow').setAttribute('data-value', s_rpm.toFixed(2));
	document.querySelector('.geardisplay').innerHTML = '<span>' + s_gear + '</span>';
	document.querySelector('#container').classList.remove('hidden');
	document.querySelector('.speeddisplay').innerHTML = '<span class="gray">' + speedText
})

mp.events.add('hideSpeedo', () => {
	document.querySelector('#container').classList.add('hidden');
})

setTimeout(() => {
	


	if (!Array.prototype.forEach) {
		Array.prototype.forEach = function (cb) {
			var i = 0, s = this.length;
			for (; i < s; i++) {
				cb && cb(this[i], i, this);
			}
		}
	}
	document.fonts && document.fonts.forEach(function (font) {
		font.loaded.then(function () {
			if (font.family.match(/Led/)) {
				document.gauges.forEach(function (gauge) {
					gauge.update();
					gauge.options.renderTo.style.visibility = 'visible';
				});
			}
		});
	});
}, 500);

</script>
<template>
	<div 
	class="absolute top-12 bottom-12 flex opacity-100 font-rajdhani hidden"
	id="container">
		<canvas 
		class=""
		id="rpmshow" data-type="radial-gauge" data-width="320" data-height="320" data-units=""
			data-title="false" data-min-value="0" data-max-value="9" data-value="0.00" data-animate-on-init="true"
			data-major-ticks="0,1,2,3,4,5,6,7,8,9" data-minor-ticks="4" data-stroke-ticks="true"
			data-highlights='[{"from": 7.5, "to": 9, "color": "rgba(242,83,108,0.9)"}]' data-color-plate="rgba(0,0,0,0)"
			data-color-major-ticks="rgba(255,255,255,0.6)" data-color-minor-ticks="rgba(255,255,255,0.6)"
			data-color-title="#fff" data-color-units="rgba(255,255,255,0.6)" data-color-numbers="rgba(255,255,255,0.6)"
			data-color-needle="rgb(255,255,255)" data-color-needle-start="rgb(255,255,255)"
			data-color-needle-end="rgb(255,255,255)" data-value-box="false" data-animated-value="true"
			data-borders="false" data-border-shadow-width="0" data-needle-type="line" data-needle-width="2"
			data-needle-circle-size="0" data-needle-shadow="false" data-needle-circle-outer="true"
			data-needle-circle-inner="false" data-needle-start="25" data-color-needle-circle-outer="rgba(0,0,0,0)"
			data-color-needle-circle-inner="rgba(0,0,0,0)" data-animation-duration="2500" data-animation-rule="linear"
			data-ticks-angle="230" data-start-angle="30" data-ticks-width="5" data-ticks-width-minor="5"
			data-color-needle-shadow-down="rgba(0,0,0,0)" data-value-box-width="45" 
			></canvas>
		<!-- <img :src="getIconByName('speedcircle')" class="speedcircle" /> -->
		<div class="geardisplay"><span>1</span></div>
		<div class="speeddisplay"><span class="gray">0</span><span class="gray">0</span><span class="gray">0</span>
		</div>
		<div class="unitdisplay">KMH</div>
		<div class="abs"><span class="gray">ABS</span></div>
		<div class="handbrake"><span class="gray">HBK</span></div>
	</div>

</template>
<style scoped>
@import url('https://fonts.cdnfonts.com/css/oswald-4');
.gauge-title {
	font-size: 14px;
	fill: #FFFFFF;
}

.gauge-value {
	font-size: 24px;
	fill: #FFFFFF;
}

.gauge-unity {
	display: none;
	font-size: 14px;
	fill: #FFFFFF;
}


#rpmshow {
	position: fixed;
	bottom: 64px;
	right: 64px;
	filter: drop-shadow(0px 0px 1px rgba(0, 0, 0, 0.6));
}

.speedcircle {
	width: 80px;
	height: 80px;
	position: fixed;
	bottom: 185px;
	right: 185px;
}

.geardisplay {
	text-align: center;
	font-size: 38px;
	width: 57px;
	height: 57px;
	position: fixed;
	bottom: 193px;
	right: 193px;
	color: rgb(249, 63, 63);
	border: 3px solid rgb(249, 63, 63);
	border-radius: 50%;
	font-style: italic;
	font-weight: bold;
}

.geardisplay span {
	margin-left: -10px;
}

.speeddisplay {
	font-size: 117px;
	position: fixed;
	bottom: 50px;
	right: 80px;
	font-style: italic;
	font-weight: 100;
	color: #FFF;
	text-shadow: 2px 2px 2px rgba(0, 0, 0, 0.1);
}

.gray {
	color: rgba(255, 255, 255, 0.5);
}

.int1 {
	position: fixed;
	bottom: 50px;
	right: 200px;
}

.int2 {
	position: fixed;
	bottom: 50px;
	right: 140px;
}

.int3 {
	position: fixed;
	bottom: 50px;
	right: 80px;
}

.unitdisplay {
	position: fixed;
	bottom: 198px;
	right: 75px;
	color: rgba(255, 255, 255, 0.6);
	font-style: italic;
	font-weight: 100;
	font-size: 22px;
}



.abs {
	position: fixed;
	bottom: 225px;
	right: 295px;
	color: rgba(255, 255, 255, 1);
	font-style: normal;
	font-weight: 100;
	font-size: 18px;
}

.handbrake {
	position: fixed;
	bottom: 200px;
	right: 293px;
	color: rgba(255, 255, 255, 1);
	font-style: normal;
	font-weight: 100;
	font-size: 18px;
}
</style>