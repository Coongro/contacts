// @ts-check
// Preset de tokens cg-* vendorizado desde @coongro/tailwind-config (core).
// Se copia acá para que el plugin sea SELF-CONTAINED: en CI el repo se buildea
// standalone y `require('../../packages/...')` no existe → rompía el build:css.
// El plugin no usa container-queries, así que ese plugin de Tailwind se omite
// (no cambia el CSS generado para las clases que usa el plugin).
// Si el design system del core cambia tokens, re-sincronizar este archivo.

const VISIBLE = { opacity: '1', transform: 'translateY(0)' };

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        cg: {
          // === Primitivas (paleta v2.2) ===
          'gold-deep': 'var(--cg-gold-deep)',
          'gold-dk': 'var(--cg-gold-dk)',
          gold: 'var(--cg-gold)',
          'gold-lt': 'var(--cg-gold-lt)',
          'gold-soft': 'var(--cg-gold-soft)',

          'teal-deep': 'var(--cg-teal-deep)',
          'teal-soft': 'var(--cg-teal-soft)',

          'red-deep': 'var(--cg-red-deep)',
          'red-dk': 'var(--cg-red-dk)',
          red: 'var(--cg-red)',
          'red-lt': 'var(--cg-red-lt)',
          'red-soft': 'var(--cg-red-soft)',

          'pink-deep': 'var(--cg-pink-deep)',
          'pink-dk': 'var(--cg-pink-dk)',
          pink: 'var(--cg-pink)',
          'pink-lt': 'var(--cg-pink-lt)',
          'pink-soft': 'var(--cg-pink-soft)',

          'sky-deep': 'var(--cg-sky-deep)',
          'sky-dk': 'var(--cg-sky-dk)',
          sky: 'var(--cg-sky)',
          'sky-lt': 'var(--cg-sky-lt)',
          'sky-soft': 'var(--cg-sky-soft)',

          black: 'var(--cg-black)',
          'neutral-950': 'var(--cg-neutral-950)',
          'neutral-700': 'var(--cg-neutral-700)',
          'neutral-500': 'var(--cg-neutral-500)',
          'neutral-300': 'var(--cg-neutral-300)',
          'neutral-200': 'var(--cg-neutral-200)',
          'neutral-100': 'var(--cg-neutral-100)',
          white: 'var(--cg-white)',

          // === Semánticos ===
          bg: 'var(--cg-bg)',
          'bg-main': 'var(--cg-bg-main)',
          'bg-secondary': 'var(--cg-bg-secondary)',
          'bg-tertiary': 'var(--cg-bg-tertiary)',
          'bg-hover': 'var(--cg-bg-hover)',
          'bg-active': 'var(--cg-bg-active)',
          'bg-overlay': 'var(--cg-bg-overlay)',
          surface: 'var(--cg-surface)',

          border: 'var(--cg-border)',
          'border-light': 'var(--cg-border-light)',
          'border-subtle': 'var(--cg-border-subtle)',
          'border-md': 'var(--cg-border-md)',
          'border-focus': 'var(--cg-border-focus)',

          text: 'var(--cg-text)',
          'text-secondary': 'var(--cg-text-secondary)',
          'text-tertiary': 'var(--cg-text-tertiary)',
          'text-muted': 'var(--cg-text-muted)',
          'text-subtle': 'var(--cg-text-subtle)',
          'text-inverse': 'var(--cg-text-inverse)',

          accent: 'var(--cg-accent)',
          'accent-hover': 'var(--cg-accent-hover)',
          'accent-bg': 'var(--cg-accent-bg)',
          'accent-text': 'var(--cg-accent-text)',

          brand: 'var(--cg-brand)',
          'brand-hover': 'var(--cg-brand-hover)',
          'brand-orange': 'var(--cg-brand-orange)',
          'brand-text': 'var(--cg-brand-text)',

          success: 'var(--cg-success)',
          'success-bg': 'var(--cg-success-bg)',
          'success-border': 'var(--cg-success-border)',
          'success-icon': 'var(--cg-success-icon)',
          green: 'var(--cg-green)',
          'green-bg': 'var(--cg-green-bg)',
          warning: 'var(--cg-warning)',
          'warning-bg': 'var(--cg-warning-bg)',
          'warning-border': 'var(--cg-warning-border)',
          'warning-text': 'var(--cg-warning-text)',
          danger: 'var(--cg-danger)',
          'danger-bg': 'var(--cg-danger-bg)',
          'danger-hover': 'var(--cg-danger-hover)',
          'danger-border': 'var(--cg-danger-border)',
          info: 'var(--cg-info)',
          'info-bg': 'var(--cg-info-bg)',
          'info-border': 'var(--cg-info-border)',

          orange: 'var(--cg-orange)',
          'orange-bg': 'var(--cg-orange-bg)',
          'orange-border': 'var(--cg-orange-border)',
          cyan: 'var(--cg-cyan)',
          'cyan-bg': 'var(--cg-cyan-bg)',
          purple: 'var(--cg-purple)',
          'purple-bg': 'var(--cg-purple-bg)',
          teal: 'var(--cg-teal)',
          'teal-dk': 'var(--cg-teal-dk)',
          'teal-lt': 'var(--cg-teal-lt)',
          'teal-icon': 'var(--cg-teal-icon)',

          'toggle-off': 'var(--cg-toggle-off)',
          'toggle-on': 'var(--cg-toggle-on)',

          'input-bg': 'var(--cg-input-bg)',
          'input-border': 'var(--cg-input-border)',
          'input-placeholder': 'var(--cg-input-placeholder)',

          skeleton: 'var(--cg-skeleton)',
        },
      },
      fontFamily: {
        serif: ["'Noto Serif JP'", 'serif'],
        sans: ['Roboto', 'sans-serif'],
      },
      fontSize: {
        '2xs': ['0.625rem', { lineHeight: '1.25' }],
      },
      borderRadius: {
        sm: '0.4375rem',
        md: '0.625rem',
        lg: '0.875rem',
        xl: '1.125rem',
        '2xl': '1.125rem',
      },
      boxShadow: {
        xs: 'var(--cg-shadow-xs)',
        sm: 'var(--cg-shadow-sm)',
        md: 'var(--cg-shadow-md)',
        lg: 'var(--cg-shadow-lg)',
        xl: 'var(--cg-shadow-xl)',
      },
      keyframes: {
        'fade-in': {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        'fade-up': {
          from: { opacity: '0', transform: 'translateY(7px)' },
          to: VISIBLE,
        },
        'modal-spring': {
          from: { opacity: '0', transform: 'translateY(14px) scale(0.97)' },
          to: { ...VISIBLE, transform: 'translateY(0) scale(1)' },
        },
        'toast-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to: VISIBLE,
        },
        'zoom-in-95': {
          from: { opacity: '0', transform: 'scale(0.95)' },
          to: { opacity: '1', transform: 'scale(1)' },
        },
        'slide-down': {
          from: { opacity: '0', transform: 'translateY(-10px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        'skeleton-shine': {
          from: { backgroundPosition: '200% 0' },
          to: { backgroundPosition: '-200% 0' },
        },
      },
      animation: {
        'fade-in': 'fade-in 0.15s ease-out',
        'fade-up': 'fade-up 0.3s ease-out both',
        'fade-up-1': 'fade-up 0.3s ease-out 0ms both',
        'fade-up-2': 'fade-up 0.3s ease-out 60ms both',
        'fade-up-3': 'fade-up 0.3s ease-out 120ms both',
        'fade-up-4': 'fade-up 0.3s ease-out 180ms both',
        'modal-spring': 'modal-spring 260ms cubic-bezier(0.34, 1.56, 0.64, 1)',
        'toast-in': 'toast-in 250ms ease-out',
        'zoom-in-95': 'zoom-in-95 0.15s ease-out',
        'slide-down': 'slide-down 0.2s ease-out',
        'skeleton-shine': 'skeleton-shine 2s linear infinite',
      },
    },
  },
  plugins: [],
};
