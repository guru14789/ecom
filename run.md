# Running the Shopyng Project

This project is a static web application built with Vanilla HTML, CSS, and JavaScript. There are several ways to run and preview the application.

## 🚀 Recommended Method: Local Development Server

Using a local server is the best way to develop and preview the project, as it prevents potential issues with browser security policies (like CORS) and provides a more consistent environment.

### 1. Using `npx serve` (Node.js required)
If you have Node.js installed, you can run a simple server directly from your terminal:

```powershell
npx serve
```
Once running, you can access the app at `http://localhost:3000` (or the port shown in your terminal).

### 2. Using VS Code Live Server
If you are using Visual Studio Code, the **Live Server** extension is highly recommended:
1. Install the "Live Server" extension from the Marketplace.
2. Open `index.html`.
3. Click the **"Go Live"** button in the bottom-right corner of the VS Code window.

---

## 📂 Available Pages

The project contains two main layouts that you can preview:

1. **Main Entry (`index.html`)**: The primary landing page and product browsing interface.
2. **Shop Layout (`shopyng.html`)**: A detailed shopping interface with advanced filtering and category management.

If you are using a local server, you can navigate between them by appending the filename to the URL (e.g., `http://localhost:3000/shopyng.html`).

---

## 🌐 Simple Method: Direct File Opening

You can also view the project without a server by opening the HTML files directly:

1. Navigate to the project folder in your File Explorer.
2. Double-click `index.html` to open it in your default web browser.

*Note: Some browser features or external scripts might not work as expected when using `file://` protocols.*

---

## 🛠️ Development Tips

- **Responsive Design**: Use the browser's Developer Tools (F12) and toggle "Device Toolbar" to see how the app looks on mobile devices.
- **Data Customization**: You can modify the products shown in the app by editing the `PRODUCTS` array in `app.js`.
- **Styling**: All global styles are located in `style.css`.
