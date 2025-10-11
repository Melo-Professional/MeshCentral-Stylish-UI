# MeshCentral Stylish UI

<p align="center">
<img width="80%" alt="banner" src="https://github.com/user-attachments/assets/ef7317ca-d55c-43dd-971d-0402f0354676" />
</p>

<p align="center">
  <a href="https://github.com/Melo-Professional/MeshCentral-Stylish-UI/releases"><img src="https://img.shields.io/badge/version-1.6.0-blue.svg" alt="version"></a>
  <a href="https://meshcentral.com"><img src="https://img.shields.io/badge/platform-MeshCentral-lightgrey.svg" alt="platform"></a>
  <a href="https://www.apache.org/licenses/LICENSE-2.0"><img src="https://img.shields.io/badge/license-Apache%202.0-blue.svg" alt="license"></a>
  <a href="#screenshots"><img src="https://img.shields.io/badge/preview-available-orange.svg" alt="preview"></a>
</p>

---

## 🖼️ Screenshots

<table align="center" border="0">
  <tr>
    <td align="center">
      <strong>Context Menu Dropdown</strong><br>
      <img width="300" height="314" alt="Tela inicial" src="https://github.com/user-attachments/assets/84316f6c-cd08-4a2b-8961-e6d594c64578" />
    </td>
    <td align="center">
      <strong>Notifications Redesign</strong><br>
      <img width="250" height="275" alt="Painel de controle" src="https://github.com/user-attachments/assets/f915837a-81bf-4716-a005-c744be747fb6" />
    </td>
  </tr>
  <tr>
    <td align="center" colspan="2">
      <strong>Leftbar New Icons</strong><br>
      <img width="67" height="393" alt="image" src="https://github.com/user-attachments/assets/cd2acfab-8341-4e9d-b874-03b7feac19ba" />
    </td>
  </tr>
  <tr>
    <td align="center" colspan="2">
      <strong>Power Graph</strong><br>
      <img width="670" height="270" alt="Resumo de dados" src="https://github.com/user-attachments/assets/a0430d09-b334-4404-b3e2-0fdeae540e6a" />
    </td>
  </tr>
  <tr>
    <td align="center" colspan="2">
      <strong>Themed Bars</strong><br>
      <img width="747" height="815" alt="Themed bars" src="https://github.com/user-attachments/assets/5001d8ac-8906-4b59-a440-c887f57148fb" />
    </td>
  </tr>
</table>

---

## 🎬 Demo Video
https://github.com/user-attachments/assets/196fe810-c98a-429c-9b7e-df52c22b79c6


https://github.com/user-attachments/assets/99ee512d-064a-4226-a5e5-0ba5588302b3


<p align="center" style="font-weight:bold; font-size:1.2em;">
And much, much more...
</p>

---

## 📦 Structure

```
meshcentral-data/
meshcentral-web/
├── public/
│   ├── images/
│   └── styles/
│       └── custom.css
│   └── scripts/
│       └── custom.js
└── views/
│       └── default3.handlebars
```

- **images/** → Contains all custom image assets.  
- **styles/custom.css** → Compiled file that combines all component-level styles.  
- **styles/components/** → Individual CSS files, separated by customization type.  
- **scripts/custom.js** → Empty script file that allows you to add custom JavaScript functionality. 
- **views/** → Optional interface template overrides (`.handlebars` files).
- **views/default3.handlebars** → Template file that includes updated desktop and mobile UI changes. 

---

## ⚙️ How to Apply

1. If it doesn’t exist yet, create the meshcentral-web/ folder in the MeshCentral root directory — alongside meshcentral-data/

2. Create the following subfolders inside meshcentral-web/ if they don’t already exist:
   ```
   meshcentral-web/public/images/
   meshcentral-web/public/styles/
   meshcentral-web/public/scripts/
   meshcentral-web/views/
   ```

3. Copy all files from `images/` to:
   ```
   meshcentral-web/public/images/
   ```

4. Copy `styles/custom.css` to:
   ```
   meshcentral-web/public/styles/custom.css
   ```

5. Copy `scripts/custom.js` to:
   ```
   meshcentral-web/public/scripts/custom.js
   ```

6. Copy `views/default3.handlebars` to:
   ```
   meshcentral-web/views/default3.handlebars
   ```

7. Change to Modern UI<br>
   <img width="255" height="262" alt="image" src="https://github.com/user-attachments/assets/14ce996d-ad46-4901-a347-68847c1da4eb" />
   > PS: You can also make Modern UI the default for all users by editing the meshcentral-data/config.json file and adding the following line under the "settings" section: `"siteStyle": 3,`
<br>
<br>

8. Refresh your browser (CTRL + F5)<br>
<br>

> The files under `styles/components/` are for reference only.  
> Use them if you prefer to apply specific parts of the customization instead of the full `custom.css`.

---

## 🧩 Components Overview

| File | Description |
|------|--------------|
| Background.css | Background visuals and transparency effects |
| ColumnsAndListView.css | List and column layout adjustments |
| Device-GeneralPage.css | Device details and general page styling |
| DropDownContextMenu.css | Dropdown and context menu enhancements |
| LeftBarCustomIcons.css | Custom icons for the left navigation bar |
| LeftBarShrinkAndColors.css | Compact mode and color adjustments for the left bar |
| LittleStuff.css | Minor UI refinements and miscellaneous tweaks |
| LoginPage.css | Login screen layout and visuals |
| Masthead.css | Header (masthead) styling |
| MobileStyles.css | Mobile styling |
| MyEvents.css | Events section customization |
| MyServerButton.css | Styling for the “My Server” button |
| Notifications.css | Visual adjustments for notifications |
| TopBar.css | Main top bar styling |
| TopMenu.css | Main Menu mobile view themed |
| UIMenu.css | General UI menu styling |

---

## 🧠 Notes

- The `custom.css` file is safe to overwrite at any time.  
- Always back up your `/meshcentral-web/` folder before updating.

---

## 🏅 Credits
<p align="left">
  • Pjotr - dear friend and the inspiration behind this project<br>
  • <a href="https://github.com/The-Dev-Ryan">TheDevRyan</a> — outstanding contributions throughout the project<br>
  • <a href="https://github.com/GlitchedCod/MeshCentral-Windows-11-Theme">GlitchedCod</a> — for most of the icons<br>
  • <a href="https://github.com/si458">Simon</a> — for general guidance<br>
  • <a href="https://github.com/Ylianst/MeshCentral">MeshCentral</a> — the ultimate RMM solution!
</p>
