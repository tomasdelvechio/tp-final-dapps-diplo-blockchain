# UNLu Academic Credentials (Soulbound Tokens)

Este proyecto implementa un sistema de verificación de credenciales académicas para la Universidad Nacional de Luján (UNLu) utilizando la tecnología blockchain. Las credenciales se emiten como tokens **Soulbound** (NFTs intransferibles), lo que garantiza que el título pertenezca exclusivamente al estudiante y no pueda ser cedido ni comercializado.

## 📋 Características Principales
- **Intransferibilidad**: Los títulos están anclados a la billetera del estudiante (Soulbound).
- **Datos On-chain**: Almacena nombre, DNI, carrera, promedio y fecha de emisión directamente en la blockchain.
- **Metadatos Extendidos**: Soporta URIs (IPFS) para adjuntar el certificado analítico completo o PDF firmado.
- **Control de Acceso**: Utiliza `AccessControl` con un `ISSUER_ROLE` específico para las autoridades.

## 🛠 Arquitectura y Flujo
...
```mermaid
sequenceDiagram
    autonumber
    actor Emisor as Autoridad UNLu (Issuer)
    participant SC as Smart Contract (AcademicCredentials)
    participant BC as Blockchain
    actor Verificador as Tercero / Estudiante

    Note over Emisor: Firma con ISSUER_ROLE
    Emisor->>SC: issueCredential(student, id, nombre, dni, carrera, promedio, uri)
    SC->>SC: Valida ISSUER_ROLE
    SC->>BC: Mintea NFT & Guarda datos en Struct
    BC-->>SC: Confirmación
    SC-->>Emisor: Título Emitido con Éxito

    Verificador->>SC: credentials(tokenId) / isValid(tokenId)
    SC->>BC: Consulta estado y datos
    BC-->>SC: Retorna Struct & Owner
    SC-->>Verificador: Muestra Credencial Verificada ✅
```

## 🚀 Guía de Desarrollo

### Requisitos
- [Foundry](https://book.getfoundry.sh/getting-started/installation)

### Compilación y Tests
```bash
# Compilar contratos
forge build

# Ejecutar tests
forge test -vv
```

### Despliegue
Para desplegar el contrato y asignar automáticamente los roles de Administrador y Emisor al desplegador:
```bash
forge script script/Deploy.s.sol --rpc-url <YOUR_RPC_URL> --broadcast
```

---
Basado en el repositorio de [ejemplo](https://github.com/dpetrocelli/diplo-unq-blockchain-clase3)

