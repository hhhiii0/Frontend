// src/stores/settings.js
import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        settings: {
            theme: 'light',
            defaultChatMode: 'text',
            language: 'zh-CN',
            fontSize: 16,
            notifications: ['new_message']
        }
    }),
    actions: {
        setSettings(settings) {
            this.settings = { ...this.settings, ...settings }
            // 保存到本地存储
            localStorage.setItem('appSettings', JSON.stringify(this.settings))
        },
        loadSettings() {
            const saved = localStorage.getItem('appSettings')
            if (saved) {
                this.settings = JSON.parse(saved)
            }
        }
    }
})