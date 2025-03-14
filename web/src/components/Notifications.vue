<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

interface Notification {
    id: number;
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration: number;
}

const notifications = ref<Notification[]>([])
const timeouts = new Map<number, ReturnType<typeof setTimeout>>()

const types = {
    info: { color: '#3B82F6', icon: 'fa-info-circle' },
    success: { color: '#10B981', icon: 'fa-check-circle' },
    warning: { color: '#F59E0B', icon: 'fa-exclamation-triangle' },
    error: { color: '#EF4444', icon: 'fa-times-circle' }
}

declare const mp: any

mp.events.add('notify', (type: any, title: string, message: string, duration: number = 5000) => {
    addNotification(title, message, type, duration)
})

const addNotification = (title: string, message: string, type: keyof typeof types, duration: number) => {
    const id = Date.now() + Math.random()
    notifications.value.push({ id, title, message, type, duration })

    timeouts.set(id, setTimeout(() => removeNotification(id), duration))
}

const removeNotification = (id: number) => {
    notifications.value = notifications.value.filter(n => n.id !== id)
    //@ts-ignore
    clearTimeout(timeouts.get(id))
    timeouts.delete(id)
}

onMounted(() => {
    // Example Notifications

})

onUnmounted(() => {
    timeouts.forEach(timeout => clearTimeout(timeout))
    timeouts.clear()
})
</script>

<template>
    <div class="fixed top-4 left-1/2 transform -translate-x-1/2 z-[1000] w-[360px] max-w-lg">
        <transition-group name="notification" tag="div" class="flex flex-col gap-3">
            <div v-for="notification in notifications" :key="notification.id"
                class="bg-zinc-900/80 border border-zinc-800/50 rounded-xl overflow-hidden flex items-start gap-4 p-4 cursor-pointer hover:border-red-500/50 transition-colors duration-200"
                @click="removeNotification(notification.id)">
                <!-- Icon -->
                <div class="w-10 h-10 rounded-lg flex items-center justify-center"
                    :style="{ backgroundColor: types[notification.type].color + '30', color: types[notification.type].color }">
                    <i :class="['fa-solid', types[notification.type].icon, 'text-xl']"></i>
                </div>

                <!-- Content -->
                <div class="flex flex-col">
                    <p class="font-rajdhani font-bold text-white text-lg">{{ notification.title }}</p>
                    <p class="font-rajdhani text-zinc-400 text-sm">{{ notification.message }}</p>
                </div>
            </div>
        </transition-group>
    </div>
</template>

<style scoped>
.notification-enter-active,
.notification-leave-active {
    transition: all 0.3s ease;
}

.notification-enter-from,
.notification-leave-to {
    opacity: 0;
    transform: translateY(-20px);
}
</style>