# Diagramas del Sistema de Credenciales Académicas

Este documento contiene los diagramas arquitectónicos y de flujo del sistema de credenciales académicas de la UNLu, modelados en lenguaje Mermaid y basados en la especificación del contrato [AcademicCredentials.sol](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/src/AcademicCredentials.sol) y los componentes de la interfaz de usuario en `frontend/`.

---

## 1. Diagrama de Componentes

Muestra la interconexión entre la interfaz de usuario (Frontend), las herramientas de firma (Wallets), el almacenamiento descentralizado (IPFS) y la infraestructura blockchain (Base Sepolia L2).

```mermaid
flowchart TD
    subgraph Capa_Cliente ["Capa Cliente (Edge/Frontend)"]
        RectorWallet["Wallet Rector (MetaMask)"]
        DecanoWallet["Wallet Decano (MetaMask)"]
        Browser["Browser Verificador (Público)"]
        FE["Frontend (Next.js 14 / Wagmi v2 / RainbowKit)"]
    end

    subgraph Capa_OnChain ["Capa Blockchain (Base Sepolia L2)"]
        SC["Smart Contract: AcademicCredentials"]
        Mapping["Mapping: credentials (uint256 a Credential)"]
        SBT["Soulbound NFT Registry (ERC721URIStorage)"]
    end

    subgraph Capa_OffChain ["Capa Almacenamiento Descentralizado"]
        IPFS["IPFS / Pinata (JSON Metadata + PDF)"]
    end

    %% Conexiones de la wallet y frontend
    RectorWallet --- |Firma de Transacciones| FE
    DecanoWallet --- |Firma de Transacciones| FE
    Browser --> |Consulta tokenId| FE

    %% Interacción Web3
    FE --- |JSON-RPC via Viem| SC
    SC --- Mapping
    SC --- SBT

    %% Integración con almacenamiento
    FE -.-> |Carga/Consulta JSON Metadata| IPFS
    SBT -.-> |metadataURI| IPFS
```

## Versión 2

```mermaid
flowchart TD
    %% --- CAPA EDGE / CLIENTE ---
    subgraph CAPA_EDGE ["EDGE / CLIENTE (Browser + Vercel)"]
        Usuario["👤 Usuario final (Browser)"]
        MetaMask["🦊 MetaMask (Extension - Custodia PK)"]
        Frontend["⚛️ Frontend Next.js (Vercel / wagmi / viem)"]
        RPC["🌐 RPC Público (Alchemy / Infura)"]

        Usuario --> MetaMask
        MetaMask <--> Frontend
        Frontend --> RPC
    end

    %% --- CAPA WEB2 INFRA ---
    subgraph CAPA_WEB2 ["WEB2 INFRA / OFF-CHAIN (k3s / Descentralizado)"]
        Backend["🔌 Backend API (Node / Python)"]
        Postgres["🗄️ Postgres (Cache eventos)"]
        Indexer["🔍 Indexer Worker (viem.watchEvent)"]
        IPFS["📦 IPFS (Pinata) (PDF + JSON)"]
        Observabilidad["📊 Tenderly - Sentry"]

        Backend --> Postgres
        Indexer --> Postgres
        Indexer -.-> Observabilidad
    end

    %% --- CAPA ON-CHAIN ---
    subgraph CAPA_ON_CHAIN ["ON-CHAIN (Base Sepolia L2 / Testnet)"]
        Contract["📜 AcademicCredentials.sol"]
        Roles["🛡️ AccessControl Roles"]
        NFT_State["🟢 NFT State (Soulbound)"]
        Etherscan["🔎 Etherscan / Explorer"]

        Contract --> Roles
        Contract --> NFT_State
        NFT_State --> Etherscan
    end

    %% --- RELACIONES INTER-CAPAS ---
    Frontend --> IPFS
    Frontend -.-> Backend
    Frontend ==> RPC

    RPC ===> Contract
    Indexer --> Contract

    %% --- ESTILOS ULTRA-COMPATIBLES ---
    classDef edgeStyle fill:#FFF5ED,stroke:#E27625,stroke-width:2px,color:#000;
    classDef web2Style fill:#F0F4FF,stroke:#2B6CB0,stroke-width:2px,color:#000;
    classDef chainStyle fill:#EDFDF5,stroke:#2F855A,stroke-width:2px,color:#000;
    classDef rpcStyle fill:#F7FAFC,stroke:#4A5568,stroke-width:2px,stroke-dasharray: 5 5,color:#4A5568;

    class Usuario edgeStyle;
    class MetaMask edgeStyle;
    class Frontend edgeStyle;

    class Backend web2Style;
    class Postgres web2Style;
    class Indexer web2Style;
    class IPFS web2Style;
    class Observabilidad web2Style;

    class Contract chainStyle;
    class Roles chainStyle;
    class NFT_State chainStyle;
    class Etherscan chainStyle;

    class RPC rpcStyle;
```

---

## 2. Modelado de Datos (Struct `Credential`)

Define las propiedades del struct [Credential](file:///home/tomas/workspace/diplomatura-blockchain/dApps/tp-final/unlu-cert-token/src/AcademicCredentials.sol#L20-L26) persistidas on-chain en el smart contract, y su relación de referencia con los metadatos almacenados off-chain en IPFS.

```mermaid
classDiagram
    class AcademicCredentials {
        +mapping(uint256 => Credential) credentials
        +grantIssuer(address account)
        +revokeIssuer(address account)
        +issueCredential(address student, uint256 tokenId, ...)
        +revoke(uint256 tokenId, string reason)
        +verify(uint256 tokenId)
    }

    class Credential {
        <<struct (On-Chain)>>
        +string degreeName
        +bytes32 studentNameHash
        +uint256 issueDate
        +bytes32 documentHash
        +bool active
    }

    class IPFS_Metadata {
        <<JSON File (Off-Chain)>>
        +string description
        +string image
        +string studentFullName
        +string studentDNI
        +string graduationDate
        +string ipfsPdfLink
    }

    AcademicCredentials "1" *-- "many" Credential : almacena
    Credential ..> IPFS_Metadata : apuntado por tokenURI (ERC721)
```

---

## 3. Diagrama de Flujo de Emisión

Describe la secuencia de pasos de autorización inicial y la emisión de una credencial para un estudiante por parte del decano/emisor.

```mermaid
sequenceDiagram
    autonumber
    actor Admin as Rector (Admin)
    actor Emisor as Decano (Issuer)
    actor Egresado as Egresado (Estudiante)
    participant FE as Frontend (Next.js)
    participant SC as Smart Contract
    participant IPFS as IPFS (Pinata)

    %% Paso 1: Asignación de rol
    Note over Admin, SC: Flujo de Autorización de Emisor
    Admin->>FE: Conectar Wallet y agregar Emisor (Address)
    FE->>SC: grantIssuer(address) (Tx firmada)
    SC->>SC: Asignar ISSUER_ROLE
    SC-->>FE: Transacción confirmada & Evento IssuerGranted

    %% Paso 2: Emisión del título
    Note over Emisor, SC: Flujo de Emisión de Credencial
    Emisor->>FE: Ingresar datos de Egresado (Nombre, DNI, Título, PDF)
    FE->>IPFS: Subir archivo PDF y JSON de Metadatos
    IPFS-->>FE: Retorna CID (IPFS URI)
    FE->>FE: Calcular hashes: studentNameHash & documentHash
    FE->>SC: issueCredential(student, tokenId, degreeName, nameHash, docHash, metadataURI) (Tx firmada)
    SC->>SC: Validar inputs (no nulos)
    SC->>SC: Mint NFT a dirección de Egresado (Soulbound)
    SC->>SC: Guardar struct Credential en mapping
    SC-->>FE: Transacción confirmada & Evento CredentialIssued
    SC-->>Egresado: Recibe NFT intransferible (SBT)
```

---

## 4. Diagrama de Flujo de Verificación Pública

Ilustra el proceso donde un tercero o empleador puede consultar de forma libre la validez y la integridad de la credencial y su PDF correspondiente.

```mermaid
sequenceDiagram
    autonumber
    actor Verificador as Verificador (Empleador / Público)
    participant FE as Frontend (Next.js)
    participant SC as Smart Contract
    participant IPFS as IPFS (Pinata)

    Verificador->>FE: Ingresar tokenId a consultar
    FE->>SC: verify(tokenId) / isValid(tokenId)
    SC-->>FE: Retorna struct Credential & bool isValid

    alt Si la credencial existe y está activa
        FE->>IPFS: Consultar metadataURI (JSON) si es necesario
        IPFS-->>FE: Retorna JSON (Datos en claro para visualización)
        FE-->>Verificador: Muestra datos del título, fecha, hash del PDF y estado (VÁLIDO ✅)
        Note over Verificador, FE: Cotejo manual opcional del PDF físico/digital:
        Verificador->>FE: Subir/arrastrar PDF del título recibido
        FE->>FE: Calcular hash keccak256 del PDF subido
        FE->>FE: Comparar hash calculado con documentHash obtenido del contrato
        alt Coinciden los hashes
            FE-->>Verificador: PDF íntegro y auténtico (Verificado)
        else No coinciden
            FE-->>Verificador: El archivo PDF ha sido alterado (Inválido ❌)
        end
    else Si no existe o fue revocada
        FE-->>Verificador: Muestra credencial no válida o inexistente (INVÁLIDO ❌)
    end
```
