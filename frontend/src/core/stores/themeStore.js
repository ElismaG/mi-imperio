import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useThemeStore = create(
  persist(
    (set, get) => ({
      tema: "claro", // 'claro' o 'oscuro'

      toggleTema: () => {
        const nuevo = get().tema === "claro" ? "oscuro" : "claro";
        set({ tema: nuevo });
        // Aplicar clase al body
        if (nuevo === "oscuro") {
          document.body.classList.add("dark");
        } else {
          document.body.classList.remove("dark");
        }
      },

      setTema: (tema) => {
        set({ tema });
        if (tema === "oscuro") {
          document.body.classList.add("dark");
        } else {
          document.body.classList.remove("dark");
        }
      },

      // Colores según el tema
      colores: () => {
        const tema = get().tema;
        if (tema === "oscuro") {
          return {
            // Fondos
            fondo: "#0F1621",
            fondoCard: "#1A2332",
            fondoCardSecundario: "#2A3547",
            fondoHover: "#2A3547",

            // Textos
            texto: "#FFFFFF",
            textoSuave: "#B0BEC5",
            textoMuted: "#8B9BB0",

            // Bordes
            borde: "#2A3547",
            bordeSuave: "#37474F",

            // Acento (naranja)
            acento: "#FF6B00",
            acentoSuave: "#FF8C3A",

            // Estados
            exito: "#27AE60",
            peligro: "#E74C3C",
            advertencia: "#FFB800",
            info: "#4A90E2",

            // Sombras
            sombra: "0 4px 20px rgba(0,0,0,0.4)",
          };
        }
        return {
          // Fondos claros
          fondo: "#F8F9FA",
          fondoCard: "#FFFFFF",
          fondoCardSecundario: "#F0F2F5",
          fondoHover: "#F5F5F5",

          // Textos
          texto: "#1A2332",
          textoSuave: "#666666",
          textoMuted: "#999999",

          // Bordes
          borde: "#EEEEEE",
          bordeSuave: "#DDDDDD",

          // Acento
          acento: "#FF6B00",
          acentoSuave: "#FF8C3A",

          // Estados
          exito: "#27AE60",
          peligro: "#E74C3C",
          advertencia: "#FFB800",
          info: "#4A90E2",

          // Sombras
          sombra: "0 4px 20px rgba(0,0,0,0.08)",
        };
      },
    }),
    {
      name: "theme-storage",
      onRehydrateStorage: () => (state) => {
        // Aplicar el tema al cargar la app
        if (state?.tema === "oscuro") {
          document.body.classList.add("dark");
        } else {
          document.body.classList.remove("dark");
        }
      },
    },
  ),
);
