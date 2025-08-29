import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import Backend from 'i18next-http-backend'

i18n.use(Backend) // 使用 i18next-http-backend
    .use(initReactI18next) // 將 i18next 傳入 react-i18next 裡面
    .init({
        backend: {
            loadPath: import.meta.env.DEV //網頁載入時去下載語言檔的位置
                ? './src/i18n/{{lng}}.json'
                : '/locales/{{lng}}.json',
        },
        fallbackLng: 'zh-Hans', // 當目前的語言檔找不到對應的字詞時，會用 fallbackLng (zh-Hans) 作為預設語言
        lng: 'zh-Hans', // 預設語言
        interpolation: {
            // 是否要讓字詞 escaped 來防止 xss 攻擊，這裡因為 React.js 已經做了，就設成 false即可
            escapeValue: false,
        },
    })

export default i18n
