<template></template>

<script setup lang="ts">
import { onMounted, ref } from 'vue';
import { request } from '@/components/custom/plugins/api'
import Bowser from "bowser";

const browser = Bowser.getParser(window.navigator.userAgent);

const loading = ref(false);

const props = defineProps<{
    path: string;
}>();

interface ApiResponse {
    code: number
    message: string
    data?: any
}

onMounted(async () => {
    request<ApiResponse>('/key-visit/repo-info', {
        path: props.path,
        browser_name: browser.getBrowserName(),
        browser_version: browser.getBrowserVersion(),
        engine_name: browser.getEngineName(),
        os_name: browser.getOSName(),
        os_version: browser.getOSVersion(),
        platform_type: browser.getPlatformType(),
        ua: browser.getUA(),
        referrer: document.referrer
    })
})
</script>
