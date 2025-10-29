
# AnimeTime Planner

**AnimeTime Planner** es una aplicación web que te ayuda a calcular cuánto tiempo necesitas para ver una serie de anime completa y te permite planificar tus maratones en un calendario. Busca información de animes en tiempo real y guarda tus cálculos para futuras referencias.

## ✨ Características

*   **Cálculo de Tiempo**: Ingresa el número de episodios y su duración para obtener el tiempo total en días, horas y minutos.
*   **Búsqueda de Anime**: Busca animes por nombre y autocompleta la información de episodios y duración usando la API de Jikan.
*   **Planificador de Calendario**: Programa tus animes en un calendario visual para organizar tus sesiones de visionado.
*   **Guardado Local**: Guarda los resultados de tus cálculos en el almacenamiento local de tu navegador.
*   **Comparativas**: Compara el tiempo necesario para ver un anime con el tiempo que tomaría leer mangas populares.

## 🚀 Cómo Arrancar el Proyecto Localmente

Sigue estos pasos para configurar y ejecutar la aplicación en tu propia máquina.

### Prerrequisitos

*   Asegúrate de tener Node.js instalado en tu sistema (se recomienda la versión 18 o superior).

### Instalación y Configuración

1.  Abre una terminal o línea de comandos en la carpeta raíz del proyecto (`c:\Users\alsan\Downloads\animetime-planner`).

2.  **(Paso importante)** Si ya existe una carpeta `node_modules` o un archivo `package-lock.json`, **bórralos** para asegurar una instalación limpia.

3.  Instala todas las dependencias necesarias ejecutando el siguiente comando. Esto leerá el archivo `package.json` y descargará todo lo que el proyecto necesita.
    ```bash
    npm install
    ```

### Ejecutar la Aplicación

1.  Una vez que la instalación se complete, ejecuta el siguiente comando para iniciar el servidor de desarrollo:
    ```bash
    npm run dev
    ```
2.  ¡Listo! Abre tu navegador web y visita http://localhost:3000. Deberías ver la aplicación funcionando.
