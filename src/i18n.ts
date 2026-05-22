import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const resources = {
  en: {
    translation: {
      "designers": "Designers",
      "home": "Home",
      "events": "Events",
      "dashboard": "Dashboard",
      "admin": "Admin",
      "login_google": "Sign in with Google",
      "login_email": "Login / Register",
      "logout": "Logout",
      "buy_ticket": "Buy Ticket",
      "my_tickets": "My Tickets",
      "admin_panel": "Admin Panel",
      "upcoming_events": "Upcoming Fashion Events",
      "tickets_available": "{{count}} tickets available",
      "price": "Price: ₼{{price}}",
      "date": "Date: {{date}}",
      "location": "Location: {{location}}",
      "create_event": "Create Event",
      "event_title": "Event Title",
      "event_description": "Description",
      "confirm_purchase": "Confirm Purchase",
      "purchase_success": "Ticket purchased successfully!",
      "no_events": "No upcoming events found.",
      "ticket_status": "Status: {{status}}",
      "email": "Email",
      "password": "Password",
      "name": "Name",
      "ticket_active": "Active",
      "ticket_used": "Used",
      "ticket_cancelled": "Cancelled"
    }
  },
  az: {
    translation: {
      "designers": "Dizaynerlər",
      "home": "Ana Səhifə",
      "events": "Tədbirlər",
      "dashboard": "Panel",
      "admin": "Admin",
      "login_google": "Google ilə daxil ol",
      "login_email": "Daxil ol / Qeydiyyat",
      "logout": "Çıxış",
      "buy_ticket": "Bilet Al",
      "my_tickets": "Biletlərim",
      "admin_panel": "Admin Paneli",
      "upcoming_events": "Qarşıdan gələn Moda Tədbirləri",
      "tickets_available": "{{count}} bilet qalıb",
      "price": "Qiymət: ₼{{price}}",
      "date": "Tarix: {{date}}",
      "location": "Məkan: {{location}}",
      "create_event": "Tədbir Yarat",
      "event_title": "Tədbirin Adı",
      "event_description": "Təsvir",
      "confirm_purchase": "Alışı Təsdiqlə",
      "purchase_success": "Bilet uğurla alındı!",
      "no_events": "Qarşıdan gələn tədbir tapılmadı.",
      "ticket_status": "Status: {{status}}",
      "email": "E-poçt",
      "password": "Şifrə",
      "name": "Ad",
      "ticket_active": "Aktiv",
      "ticket_used": "İstifadə edilib",
      "ticket_cancelled": "Ləğv edilib"
    }
  },
  ru: {
    translation: {
      "designers": "Дизайнеры",
      "home": "Главная",
      "events": "События",
      "dashboard": "Личный кабинет",
      "admin": "Админ-панель",
      "login_google": "Войти через Google",
      "login_email": "Войти / Регистрация",
      "logout": "Выйти",
      "buy_ticket": "Купить билет",
      "my_tickets": "Мои билеты",
      "admin_panel": "Панель администратора",
      "upcoming_events": "Предстоящие показы мод",
      "tickets_available": "Доступно {{count}} билетов",
      "price": "Цена: ₼{{price}}",
      "date": "Дата: {{date}}",
      "location": "Место: {{location}}",
      "create_event": "Создать событие",
      "event_title": "Название события",
      "event_description": "Описание",
      "confirm_purchase": "Подтвердить покупку",
      "purchase_success": "Билет успешно куплен!",
      "no_events": "Предстоящих событий не найдено.",
      "ticket_status": "Статус: {{status}}",
      "email": "Эл. адрес",
      "password": "Пароль",
      "name": "Имя",
      "ticket_active": "Активен",
      "ticket_used": "Использован",
      "ticket_cancelled": "Отменен"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en", // default
    fallbackLng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
