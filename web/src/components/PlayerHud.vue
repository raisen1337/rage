<script setup lang="ts">
import { ref, watch } from "vue";

const inSafezone = ref(false);
const playerName = ref("notraisen");
const playerId = ref(1);
const playerCash = ref(3000);
const maxPlayers = ref(1000);
const currentPlayers = ref(30);
const questions = ref(2);
const tickets = ref(258);
const isAdmin = ref(false);

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

// Time & Date
const formatWithLeadingZero = (number: number) =>
	number < 10 ? `0${number}` : number;

const time = ref(
	`${formatWithLeadingZero(new Date().getHours())}:${formatWithLeadingZero(new Date().getMinutes())}`,
);
const date = ref(
	`${formatWithLeadingZero(new Date().getDate())}.${formatWithLeadingZero(new Date().getMonth() + 1)}.${new Date().getFullYear()}`,
);

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
	<div
		class="w-full h-full font-poppins bg-transparent flex flex-col justify-between p-6 animate-fade-in-fast absolute top-0"
	>
		<div class="flex flex-col w-full h-fit gap-2">
			<div
				class="w-full h-fit flex flex-row items-center justify-end gap-2"
			>
				<div
					class="flex items-center justify-center w-[40px] border-2 bg-red-950/90 border-red-500 h-[40px] rounded-full"
				>
					<i class="fa-solid fa-user text-red-500"></i>
				</div>
				<span class="text-white font-extralight text-xl">{{
					playerName
				}}</span>
				<div
					class="flex flex-row items-center gap-2 pl-3 pr-2 py-1 bg-black/70 border-zinc-600 border rounded-full w-fit h-fit"
				>
					<span class="text-white font-extralight text-xl">{{
						time
					}}</span>
					<span
						class="text-white px-2 py-1 text-normal font-light bg-black rounded-2xl font-bai uppercase"
					>
						{{ date }}
					</span>
				</div>
				<div
					v-show="inSafezone"
					class="flex flex-row items-center gap-2 px-3 py-2 bg-red-950/80 border-red-600 border rounded-full w-fit h-fit"
				>
					<div
						class="flex items-center justify-center w-[25px] border-2 bg-red-500 border-red-500 h-[25px] bg-zinc-900/80 rounded-full"
					>
						<i class="fa-solid text-xs fa-shield text-red-500"></i>
					</div>
					<span
						class="text-red-500 font-bai text-sm uppercase font-medium"
						>Safezone</span
					>
				</div>
				<!-- <div
                    class="flex items-center justify-center w-[40px] border-2 bg-red-950/90 border-red-500 h-[40px] bg-zinc-900/80 rounded-full">
                    <i class="fa-solid fa-microphone text-red-500"></i>
                </div> -->
				<span class="text-white font-bai text-3xl uppercase font-medium"
					>REVERSY</span
				>
			</div>
			<div
				class="w-full h-fit flex flex-row items-center justify-end gap-2"
			>
				<div
					v-show="isAdmin"
					class="flex flex-row items-center gap-2 pl-3 pr-2 py-1 bg-black/70 border-zinc-600 border rounded-full w-fit h-fit"
				>
					<span
						:class="{ 'scale-animation': animateQuestions }"
						class="text-white font-extralight text-lg"
					>
						{{ questions }}
					</span>
					<span
						class="text-white px-2 py-1 text-sm font-light bg-black rounded-2xl font-bai uppercase"
					>
						Intrebari
					</span>
				</div>
				<div
					v-show="isAdmin"
					class="flex flex-row items-center gap-2 pl-3 pr-2 py-1 bg-black/70 border-zinc-600 border rounded-full w-fit h-fit"
				>
					<span
						:class="{ 'scale-animation': animateTickets }"
						class="text-white font-extralight text-lg"
					>
						{{ tickets }}
					</span>
					<span
						class="text-white px-2 py-1 text-sm font-light bg-black rounded-2xl font-bai uppercase"
					>
						Tichete
					</span>
				</div>
				<div class="flex flex-row items-center gap-1">
					<div
						class="flex items-center justify-center w-[35px] border-2 bg-red-950/90 border-red-500 h-[35px] rounded-full"
					>
						<i class="fa-solid fa-hashtag text-sm text-red-500"></i>
					</div>
					<span class="text-white text-lg">ID: {{ playerId }}</span>
				</div>
				<div class="flex flex-row items-center gap-1">
					<div
						class="flex items-center justify-center w-[35px] border-2 bg-red-950/90 border-red-500 h-[35px] rounded-full"
					>
						<i class="fa-solid fa-wifi text-sm text-red-500"></i>
					</div>
					<span
						:class="{ 'scale-animation': animatePlayers }"
						class="text-white text-lg"
					>
						{{ currentPlayers }}
					</span>
					<span class="text-white/50 text-lg">/</span>
					<span class="text-white/50 text-sm">{{ maxPlayers }}</span>
				</div>
			</div>
			<div class="flex flex-row items-center justify-end gap-6 -mr-10">
				<div class="flex flex-col items-end">
					<span class="text-white/50 font-bai uppercase text-md"
						>Cash money</span
					>
					<span
						class="text-[#FF0000] font-bai font-extrabold text-2xl"
					>
						${{ playerCash.toLocaleString() }}
					</span>
				</div>
				<i class="fa-solid fa-rhombus text-[#FF0000]"></i>
			</div>
			<div
				id="weaponHud"
				class="hidden w-full h-fit flex flex-col justify-end items-end transition-all"
			>
				<img
					id="weaponImage"
					class="max-w-[12rem] brightness-[0.5] scale-x-[-1]"
					style=""
					alt=""
					src="https://vespura.com/fivem/weapons/images/WEAPON_ADVANCEDRIFLE.png"
				/>
				<div class="flex flex-row items-center gap-2">
					<!-- Ammo icon SVG -->
					<svg
						style="width: calc(40px * var(--config-size))"
						fill="#ff0000"
						version="1.1"
						id="Layer_1"
						xmlns="http://www.w3.org/2000/svg"
						xmlns:xlink="http://www.w3.org/1999/xlink"
						viewBox="0 0 503.607 503.607"
						xml:space="preserve"
					>
						<!-- SVG content omitted for brevity -->
					</svg>
					<div
						class="flex flex-col bg-red-500/0 items-end w-[20rem] justify-end"
					>
						<span
							id="weaponName"
							style="
								font-size: calc(1.125rem * var(--config-size));
							"
							class="mt-2 w-full text-end font-bold text-white"
						>
							Assault Rifle MK2
						</span>
						<span
							id="ammoText"
							style="font-size: calc(1rem * var(--config-size))"
							class="mt-2 text-white/50 font-normal"
						>
							30/240
						</span>
					</div>
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
