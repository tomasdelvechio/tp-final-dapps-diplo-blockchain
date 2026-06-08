# UNLu · Registro de Credenciales Académicas — Frontend

Este es el frontend de la dApp para emisión y verificación de credenciales académicas "Soulbound" de la **Universidad Nacional de Luján (UNLu)**. Está desarrollado utilizando **Next.js 14 (App Router)**, **Wagmi v2**, **Viem v2** y **RainbowKit**.

---

## 🛠️ Características Implementadas

1.  **Dashboard Adaptativo por Roles**: La interfaz de usuario detecta de forma automática los permisos de la wallet conectada y despliega solapas de acceso seguro:
    *   **Público**: Verificador de credenciales.
    *   **Emisor (Issuer)**: Acceso para dependencias universitarias (`ISSUER_ROLE`).
    *   **Administración (Rectorado)**: Acceso para el Rector/Administrador central (`DEFAULT_ADMIN_ROLE`).
2.  **Verificación Pública con Código QR**:
    *   Cualquier persona puede ingresar un `tokenId` para verificar el estado de un título.
    *   Consulta on-chain de la existencia, validez, wallet del graduado (`ownerOf`) e IPFS Metadata (`tokenURI`).
    *   Genera un **Código QR** interactivo mediante `react-qr-code` apuntando a la verificación directa en la dApp.
    *   Soporta carga automática mediante query params de URL (ej. `https://mi-dapp.vercel.app/?tokenId=1`).
3.  **Privacidad Criptográfica Local**:
    *   En el panel de emisor, el nombre del graduado, DNI e identificadores del PDF se hashean localmente en el navegador usando `keccak256` y `encodePacked` de Viem antes de enviarse a la blockchain.
    *   La UI provee un panel de **previsualización en vivo** que muestra cómo los datos se convierten en hashes irreversibles para proteger los datos personales.
4.  **Panel de Revocación de Credenciales**:
    *   Los emisores autorizados pueden dar de baja credenciales on-chain especificando un motivo de revocación público.
5.  **Panel de Administración (Rectorado)**:
    *   Permite al Administrador central otorgar (`grantIssuer`) y remover (`revokeIssuer`) permisos de emisión a wallets universitarias.

---

## ⛓️ Red y Dirección del Contrato

*   **Red de Despliegue**: Ethereum Sepolia Testnet (con soporte configurado para migración o multired a Base Sepolia).
*   **Dirección del Contrato**: `0x31a44d04cdbfff0fdf32ffc48d4f87ff3186c63b`
*   **Configuración del ABI**: Definido en [credentials.ts](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/frontend/contracts/credentials.ts).

---

## 🚀 Comandos de Ejecución y Despliegue

Asegurate de tener instalado **Node.js (versión 18 o superior, preferentemente 20)**.

### 1. Instalación de Dependencias
Instalá los paquetes necesarios para correr el proyecto:
```bash
npm install
```

### 2. Configurar WalletConnect / Reown
Crea un archivo llamado `.env.local` en la raíz de la carpeta `frontend/` y añade tu Project ID de WalletConnect (obtenido de [Reown Cloud](https://cloud.reown.com/)):
```env
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=tu_project_id_de_reown_cloud
```

### 3. Correr Servidor de Desarrollo Local
Iniciá la dApp localmente. La consola te indicará la dirección (usualmente `http://localhost:3000`):
```bash
npm run dev
```

### 4. Compilación para Producción (Build)
Generá el bundle optimizado listo para producción:
```bash
npm run build
```

### 5. Iniciar Servidor de Producción Local
Luego del build, podés levantar el servidor de producción localmente para pruebas de rendimiento:
```bash
npm run start
```

---

## 📂 Estructura del Frontend

```text
├── app/
│   ├── layout.tsx         # Layout base y configuración de cabeceras
│   ├── providers.tsx      # Configuración de RainbowKit, Wagmi y React Query
│   ├── page.tsx           # Dashboard principal y control de solapas
│   ├── globals.css        # Hoja de estilos premium del sitio
│   └── components/
│       ├── Verifier.tsx            # Formulario de verificación y código QR
│       ├── IssueCredentialForm.tsx # Formularios de emisión y revocación
│       └── AdminPanel.tsx          # Panel de Rectorado para otorgar/revocar roles
├── contracts/
│   └── credentials.ts     # ABI, dirección del contrato y hashes de roles
├── next.config.js         # Configuración del compilador de Next.js
└── wagmi.ts               # Configuración de redes de conexión de wallets
```

---

## 🌐 Despliegue en Producción (Vercel)

El frontend está optimizado para ser desplegado en **Vercel** de manera gratuita:
1. Conecta tu repositorio forkeado en la plataforma de Vercel.
2. Asegurate de configurar el subdirectorio de despliegue como `frontend`.
3. Añade la variable de entorno `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` en la configuración del proyecto en Vercel.
4. Vercel compilará la aplicación y te proporcionará una URL pública que podrás compartir en el informe del TP Final.
