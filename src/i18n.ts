import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// the translations
// (tip move them in a JSON file and import them,
// or even better, manage them separated from your code: https://react.i18next.com/guides/multiple-translation-files)
const resources = {
    uz: {
        translation: {
            "app": {
                "title": "Tarix Testi",
                "question1": "Amir Temur davlatiga qaysi yilda asos solingan?",
                "question2": "Mirzo Ulug'bek Samarqandda qanday inshoot qurdirgan?",
                "question3": "'Tib qonunlari' asari muallifi kim?",
                "newQuestion": "Yangi savol?",
                "variantA": "Variant A",
                "variantB": "Variant B",
                "variantC": "Variant C",
            },
            "editor": {
                "title": "Quiz Video Tayyorlash",
                "subtitle": "TikTok, Instagram Reels va YouTube Shorts uchun",
                "download": "Video Yuklab Olish",
                "preparing": "Tayyorlanmoqda...",
                "play": "Ko'rish",
                "aiTitle": "AI yordamida test yaratish",
                "aiPlaceholder": "Mavzuni kiriting (masalan: Tarix, Matematika, Mantiq...)",
                "aiGenerate": "Yaratish",
                "aiGeneratingQuestions": "Savollar tuzilmoqda...",
                "aiGeneratingAudio": "Ovozlar yaratilmoqda...",
                "question": "Savol",
                "questionText": "Savol matni",
                "questionPlaceholder": "Masalan: Amir Temur davlatiga qaysi yilda asos solingan?",
                "optionsText": "Variantlar (To'g'ri javobni belgilang)",
                "optionPlaceholder": "Variant",
                "bgImageText": "Orqa fon rasmi (URL)",
                "audioGenerate": "AI Ovoz yaratish",
                "audioUpdate": "Ovozni yangilash",
                "audioReady": "Ovoz tayyor",
                "addQuestion": "Yangi savol qo'shish",
                "errorAudio": "Ovoz yaratishda xatolik yuz berdi.",
                "errorAI": "AI yordamida savollar yaratishda xatolik yuz berdi.",
                "errorGeneral": "Xatolik yuz berdi.",
                "errorVideo": "Video yaratishda xatolik yuz berdi.",
                "videoPreparingText": "Iltimos, sahifani yopmang yoki boshqa oynaga o'tmang! Aks holda videoda ovoz va tasvir mos kelmay qolishi mumkin.",
                "timerDuration": "O'ylash vaqti (soniya)"
            },
            "player": {
                "score": "Natija",
                "outOf": "dan",
                "exit": "Tahrirlashga qaytish",
                "next": "Keyingisi",
                "restart": "Qayta boshlash",
                "endTitle": "Test yakunlandi!",
                "endText": "Barcha savollar namoyish etildi.",
                "thinkTime": "O'YLASH VAQTI...",
                "correctAnswer": "TO'G'RI JAVOB"
            }
        }
    },
    ru: {
        translation: {
            "app": {
                "title": "Тест по истории",
                "question1": "В каком году было основано государство Амира Тимура?",
                "question2": "Какое сооружение построил Мирзо Улугбек в Самарканде?",
                "question3": "Кто автор труда 'Канон врачебной науки'?",
                "newQuestion": "Новый вопрос?",
                "variantA": "Вариант А",
                "variantB": "Вариант Б",
                "variantC": "Вариант В",
            },
            "editor": {
                "title": "Создание Квиз Видео",
                "subtitle": "Для TikTok, Instagram Reels и YouTube Shorts",
                "download": "Скачать видео",
                "preparing": "Подготовка...",
                "play": "Смотреть",
                "aiTitle": "Создание теста с помощью ИИ",
                "aiPlaceholder": "Введите тему (например: История, Математика, Логика...)",
                "aiGenerate": "Создать",
                "aiGeneratingQuestions": "Вопросы создаются...",
                "aiGeneratingAudio": "Голоса создаются...",
                "question": "Вопрос",
                "questionText": "Текст вопроса",
                "questionPlaceholder": "Например: В каком году было основано государство Амира Тимура?",
                "optionsText": "Варианты (отметьте правильный ответ)",
                "optionPlaceholder": "Вариант",
                "bgImageText": "Фоновое изображение (URL)",
                "audioGenerate": "Создать ИИ голос",
                "audioUpdate": "Обновить голос",
                "audioReady": "Голос готов",
                "addQuestion": "Добавить новый вопрос",
                "errorAudio": "Произошла ошибка при создании голоса.",
                "errorAI": "Произошла ошибка при создании вопросов с помощью ИИ.",
                "errorGeneral": "Произошла ошибка.",
                "errorVideo": "Произошла ошибка при создании видео.",
                "videoPreparingText": "Пожалуйста, не закрывайте страницу и не переключайтесь на другое окно! Иначе звук и видео могут не совпасть.",
                "timerDuration": "Время на размышление (сек)"
            },
            "player": {
                "score": "Результат",
                "outOf": "из",
                "exit": "Вернуться к редактированию",
                "next": "Следующий",
                "restart": "Начать заново",
                "endTitle": "Тест завершен!",
                "endText": "Все вопросы были показаны.",
                "thinkTime": "ВРЕМЯ НА РАЗМЫШЛЕНИЕ...",
                "correctAnswer": "ПРАВИЛЬНЫЙ ОТВЕТ"
            }
        }
    },
    en: {
        translation: {
            "app": {
                "title": "History Quiz",
                "question1": "In what year was the state of Amir Temur founded?",
                "question2": "What structure did Mirzo Ulugbek build in Samarkand?",
                "question3": "Who is the author of 'The Canon of Medicine'?",
                "newQuestion": "New Question?",
                "variantA": "Option A",
                "variantB": "Option B",
                "variantC": "Option C",
            },
            "editor": {
                "title": "Quiz Video Creator",
                "subtitle": "For TikTok, Instagram Reels and YouTube Shorts",
                "download": "Download Video",
                "preparing": "Preparing...",
                "play": "Play",
                "aiTitle": "Create quiz with AI",
                "aiPlaceholder": "Enter a topic (e.g., History, Math, Logic...)",
                "aiGenerate": "Generate",
                "aiGeneratingQuestions": "Generating questions...",
                "aiGeneratingAudio": "Generating audio...",
                "question": "Question",
                "questionText": "Question text",
                "questionPlaceholder": "E.g.: In what year was the state of Amir Temur founded?",
                "optionsText": "Options (mark the correct answer)",
                "optionPlaceholder": "Option",
                "bgImageText": "Background Image (URL)",
                "audioGenerate": "Generate AI Audio",
                "audioUpdate": "Update Audio",
                "audioReady": "Audio ready",
                "addQuestion": "Add new question",
                "errorAudio": "Error generating audio.",
                "errorAI": "Error generating quiz using AI.",
                "errorGeneral": "An error occurred.",
                "errorVideo": "Error generating video.",
                "videoPreparingText": "Please do not close this page or switch to another window! Otherwise, the audio and video might go out of sync.",
                "timerDuration": "Thinking time (seconds)"
            },
            "player": {
                "score": "Score",
                "outOf": "of",
                "exit": "Back to editing",
                "next": "Next",
                "restart": "Restart",
                "endTitle": "Quiz finished!",
                "endText": "All questions have been shown.",
                "thinkTime": "THINKING TIME...",
                "correctAnswer": "CORRECT ANSWER"
            }
        }
    }
};

i18n
    .use(initReactI18next) // passes i18n down to react-i18next
    .init({
        resources,
        lng: "uz", // default language
        fallbackLng: "en",
        interpolation: {
            escapeValue: false // react already safes from xss
        }
    });

export default i18n;
