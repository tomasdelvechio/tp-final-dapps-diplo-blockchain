# UNLu Academic Credentials Verification (Trabajo Final DApps)

Este repositorio es un monorepo que contiene la solución para el Trabajo Final de la Diplomatura en Blockchain, consistente en una aplicación descentralizada (dApp) para la emisión y verificación de credenciales académicas oficiales de la **Universidad Nacional de Luján (UNLu)** utilizando tokens "Soulbound" (NFTs ERC-721 no transferibles).

---

## 🏗️ Estructura del Monorepo

El proyecto está organizado en dos componentes principales:

* **`unlu-cert-token/`**: Smart contracts desarrollados en **Solidity** utilizando el entorno de desarrollo **Foundry**.
* **`frontend/`**: Aplicación web desarrollada en **Next.js 14**, **Wagmi v2**, **Viem v2** y **RainbowKit** para interactuar con la blockchain.

---

## ⚙️ Requisitos Previos

Antes de comenzar, asegurate de tener instalado en tu sistema:

* [Node.js](https://nodejs.org/) (Versión 18 o superior, preferentemente v20).
* [Foundry (Forge, Cast)](https://book.getfoundry.sh/getting-started/installation) para compilar y testear los contratos inteligentes.
* Una wallet de navegador como [MetaMask](https://metamask.io/) o [Rabby Wallet](https://rabby.io/) configurada en la red de pruebas Sepolia.

---

## ⛓️ Smart Contracts (`unlu-cert-token/`)

Contiene el contrato `AcademicCredentials.sol` que implementa el estándar ERC-721 y control de accesos (`AccessControl`) de OpenZeppelin. Los tokens emitidos son intransferibles (Soulbound) anulando el método `_update` de Solidity.

### Dirección del Contrato Desplegado

* **Red**: Ethereum Sepolia Testnet
* **Contrato**: `0x31a44d04cdbfff0fdf32ffc48d4f87ff3186c63b`

### Comandos Básicos (desde la carpeta `unlu-cert-token/`)

1. **Instalar dependencias (OpenZeppelin)**:
   
   ```bash
   forge install openzeppelin/openzeppelin-contracts --no-commit
   ```
2. **Compilar contratos**:
   
   ```bash
   forge build
   ```
3. **Ejecutar batería de pruebas**:
   
   ```bash
   forge test
   ```
4. **Ver reporte de cobertura de código (+80% coverage)**:
   
   ```bash
   forge coverage
   ```
5. **Desplegar contrato en la testnet**:
   Crea un archivo `.env` configurando tu clave privada, RPC url y API key de Etherscan, luego ejecuta:
   
   ```bash
   set -a
   source .env
   set +a
   forge script script/Deploy.s.sol --rpc-url $BASE_SEPOLIA_RPC_URL --private-key $PRIVATE_KEY --broadcast --verify --etherscan-api-key $BASESCAN_API_KEY
   ```

---

## 💻 Frontend (`frontend/`)

Interfaz web interactiva y responsiva con estilo premium oscuro adaptado a los colores de la UNLu, diseñada para consultar credenciales, hashear datos del alumno localmente y emitir/revocar tokens on-chain según la firma digital de la wallet conectada.

### Comandos Básicos (desde la carpeta `frontend/`)

1. **Instalar dependencias de Node**:
   
   ```bash
   npm install
   ```
2. **Configurar variables de entorno**:
   Crea un archivo `.env.local` y añade tu ID de proyecto de WalletConnect:
   
   ```env
   NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=tu_project_id_de_reown_cloud
   ```
3. **Correr dApp en modo desarrollo**:
   
   ```bash
   npm run dev
   ```
   
   *Abre [http://localhost:3000](http://localhost:3000) en tu navegador.*
4. **Compilar para producción (Build)**:
   
   ```bash
   npm run build
   ```
5. **Iniciar servidor en producción local**:
   
   ```bash
   npm run start
   ```

---

## 🔒 Privacidad y Flujo de Trabajo

1. **Super-Admin (Rectorado)**: Conecta la wallet autorizada y asume el rol de administrador principal. Otorga o revoca el permiso de emisión (`ISSUER_ROLE`) a las wallets de los distintos departamentos o institutos.
2. **Emisor (Departamento)**: Completa el formulario de emisión. Los datos personales legibles del estudiante (Nombre y DNI) se hashean off-chain en el navegador antes de enviarse. La blockchain almacena únicamente el hash irreversible, protegiendo los datos personales conforme a normativas de privacidad.
3. **Verificador Público (Tercero)**: Cualquier reclutador o institución consulta el ID de una credencial. El validador devuelve el nombre de la carrera, fecha de emisión, dirección de la wallet propietaria y los hashes criptográficos correspondientes, además de un Código QR único para facilitar la validación móvil.