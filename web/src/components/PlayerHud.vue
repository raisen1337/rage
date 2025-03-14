<script setup lang="ts">
import { ref, watch } from "vue";

const inSafezone = ref(false);
const playerName = ref("notraisen");
const playerId = ref(1);
const playerCash = ref(153217823);
const maxPlayers = ref(1000);
const currentPlayers = ref(30);
const questions = ref(2);
const tickets = ref(258);
const isAdmin = ref(false);
const actHud = ref(true);
const payday = ref({
	seconds: 3600,	
})

// Reactivity for animations
const animateTickets = ref(false);
const animateQuestions = ref(false);
const animatePlayers = ref(false);

const triggerAnimation = (refVar: any) => {
	refVar.value = true;
	setTimeout(() => {
		refVar.value = false;
	}, 300); // Duration of animation
};

// Watchers for changes
watch(tickets, () => triggerAnimation(animateTickets));
watch(questions, () => triggerAnimation(animateQuestions));
watch(currentPlayers, () => triggerAnimation(animatePlayers));

const formatMoney = (value: number) => {
	if (value >= 1000000) {
		return `${(value / 1000000).toFixed(1)}M`;
	} else if (value >= 1000) {
		return `${(value / 1000).toFixed(1)}K`;
	}
	return value.toString();
};

// Time & Date
const formatWithLeadingZero = (number: number) =>
	number < 10 ? `0${number}` : number;

const time = ref(
	`${formatWithLeadingZero(new Date().getHours())}:${formatWithLeadingZero(new Date().getMinutes())}`,
);
const date = ref(
	`${formatWithLeadingZero(new Date().getDate())}.${formatWithLeadingZero(new Date().getMonth() + 1)}.${new Date().getFullYear()}`,
);

const formateSeconds = (seconds: number) => {
	const minutes = Math.floor(seconds / 60);
	const remainingSeconds = seconds % 60;
	return `${formatWithLeadingZero(minutes)}:${formatWithLeadingZero(remainingSeconds)}`;
};
declare const mp: any;

mp.events.add("updateUI", (data: any) => {
	data = JSON.parse(data);
	inSafezone.value = data.safezone;
	playerName.value = data.name;
	playerId.value = data.id;
	isAdmin.value = data.admin ? true : false;
	playerCash.value = data.cash;
	maxPlayers.value = data.maxPlayers;
	currentPlayers.value = data.currentPlayers;
	questions.value = data.questions;
	tickets.value = data.tickets;
});

mp.events.add(
	"equipWeapon",
	(weapon: string, ammo: number, maxAmmo: number, name: string) => {
		const weaponHud = document.getElementById("weaponHud");
		const weaponImage = document.getElementById("weaponImage");
		const weaponName = document.getElementById("weaponName");
		const ammoText = document.getElementById("ammoText");

		if (weaponHud && weaponImage && weaponName && ammoText) {
			weaponHud.classList.remove("hidden");
			//https://docs.fivem.net/weapons/WEAPON_COMPACTLAUNCHER.png
			weaponImage.src = `https://docs.fivem.net/weapons/${weapon.toUpperCase()}.png`;
			weaponName.innerHTML = name;
			ammoText.innerHTML = `${ammo}/${maxAmmo * 8}`;
		}
	},
);

//update ammo
mp.events.add("updateWeaponAmmo", (ammo: number, maxAmmo: number) => {
	const ammoText = document.getElementById("ammoText");
	if (ammoText) {
		ammoText.innerHTML = `${ammo}/${maxAmmo * 8}`;
	}
});

mp.events.add("unequipWeapon", () => {
	const weaponHud = document.getElementById("weaponHud");
	if (weaponHud) {
		weaponHud.classList.add("hidden");
	}
});

</script>

<template>
	<div class="w-full h-full !font-spg bg-black/0 flex flex-col justify-between p-6 animate-fade-in-fast absolute top-0 select-none"
		v-if="actHud">
		<div class="w-screen absolute top-0 left-0 h-screen bg-radient-circle-tl from-black/40 via-transparent to-transparent"></div>
		<div class="w-screen absolute top-0 left-0 h-screen bg-radient-circle-tr from-black/40 via-transparent to-transparent"></div>
		<div class="w-full h-fit bg-red-600/0 flex flex-col items-end justify-start p-2">
			<div class="flex flex-col gap-2">
				<div class="flex flex-row items-start">
					<div class="flex flex-row mt-1 mr-4 items-center gap-2">
						<span class="text-white/50 text-xs">{{ playerId }}</span>
						<i class="fa-solid fa-hashtag text-xs text-white/50"></i>
						<span class="text-white/50 text-xs">{{  currentPlayers }}/{{ maxPlayers }}</span>
						<i class="fa-solid fa-user text-xs text-white/50"></i>
					</div>
					<div class="flex flex-col text-end">
						<span class="text-white text-md font-bold">VIPURI ROMANIA</span>
						<span class="text-white/50 text-xs -mt-2">discord.gg/vipuriro</span>
					</div>
					<img class="w-[60px] -mt-4 ml-3"
						src="https://cdn.gta5lbrp.com/Bdlp/logonotxt.png"
						alt="">
				</div>
				<div class="flex relative bg-gradient-to-l mt-3 from-pink-200/30 via-transparent to-transparent flex-row items-center justify-end">
					<div class="flex flex-col text-end mr-7">
						<span class="text-white text-sm font-bold">PAYDAY</span>
						<span class="text-white/50 text-xs">{{ formateSeconds(payday.seconds) }}</span>
					</div>	
					<img 
					class="w-[100px] absolute z-[5] -right-7 -mr-[19px]"
					src="https://cdn.gta5lbrp.com/Bdlp/Hud/payday.png" alt="" srcset="">
				</div>
				<div class="flex relative bg-gradient-to-l mt-3 from-yellow-200/30 via-transparent to-transparent flex-row items-center justify-end">
					<div class="flex flex-col text-end mr-7">
						<span class="text-white/50 text-xs font-bold">BANII CASH</span>
						<span class="text-yellow-200 text-sm">${{ formatMoney(playerCash) }}</span>
					</div>	
					<img 
					class="w-[120px] absolute -mr-[57px]"
					src="https://cdn.gta5lbrp.com/Bdlp/Hud/Money.png" alt="" srcset="">
				</div>
			</div>

		</div>
	</div>
</template>

<style scoped>
.scale-animation {
	animation: scaleEffect 0.6s ease-in-out;
}

@keyframes scaleEffect {
	0% {
		transform: scale(1);
	}

	50% {
		transform: scale(1.3);
	}

	100% {
		transform: scale(1);
	}
}
</style>
