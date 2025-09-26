# Sistema de Relatórios

Esta é a estrutura modularizada do sistema de relatórios da aplicação Pro Medições.

## Estrutura de Pastas

```
reports/
├── reports.component.ts              # Componente principal - lista tipos de relatórios
├── reports.routes.ts                 # Configuração de rotas
└── report/                           # Pasta principal dos relatórios
    ├── report.component.ts           # Wrapper component com funcionalidades comuns
    ├── monthly-consumption/          # Relatório de Consumo Mensal
    │   └── monthly-consumption.component.ts
    ├── quarterly-comparative/        # Relatório Comparativo Trimestral
    │   └── quarterly-comparative.component.ts
    ├── economy-analysis/            # Análise de Economia
    │   └── economy-analysis.component.ts
    └── billing/                     # Relatório de Faturamento
        └── billing.component.ts
```

## Componentes

### 1. ReportsComponent (`reports.component.ts`)
- **Função**: Tela principal de relatórios
- **Responsabilidades**:
  - Listar tipos de relatórios disponíveis
  - Mostrar status de cada relatório (disponível, em desenvolvimento, planejado)
  - Exibir histórico de relatórios recentes
  - Navegação para geração de relatórios específicos

### 2. ReportComponent (`report/report.component.ts`)
- **Função**: Wrapper comum para todos os relatórios
- **Responsabilidades**:
  - Interface unificada com header, ações e status
  - Controle de estado (gerando, completo, erro)
  - Funcionalidades comuns: exportar PDF, voltar, retry
  - Router outlet para componentes específicos

### 3. Componentes Específicos

#### MonthlyConsumptionComponent
- **Status**: ✅ **Implementado e funcional**
- **Recursos**:
  - Análise detalhada de consumo por unidade
  - Resumo executivo com métricas
  - Identificação de consumo elevado
  - Recomendações baseadas em dados
  - Tabela completa com todas as unidades

#### QuarterlyComparativeComponent
- **Status**: 🚧 **Em desenvolvimento**
- **Recursos**:
  - Comparação entre trimestres
  - Métricas básicas por período
  - Placeholder para gráficos futuros

#### EconomyAnalysisComponent
- **Status**: 🚧 **Em desenvolvimento**
- **Recursos**:
  - Interface preparada para análises de economia
  - Seções planejadas: desperdícios, potencial de economia, recomendações

#### BillingComponent
- **Status**: 🚧 **Em desenvolvimento**
- **Recursos**:
  - Interface preparada para relatórios financeiros
  - Seções planejadas: detalhamento de custos, rateio, histórico

## Rotas

```
/reports                                    # Lista de relatórios
/reports/report/monthly-consumption         # Relatório mensal
/reports/report/quarterly-comparative       # Relatório trimestral
/reports/report/economy-analysis           # Análise de economia
/reports/report/billing                    # Faturamento
```

## Features Implementadas

### ✅ Completamente Funcional
- Interface principal de listagem de relatórios
- Sistema de status para cada tipo de relatório
- Relatório de Consumo Mensal com dados simulados
- Navegação entre componentes
- Layout responsivo
- Sistema de estado (loading, success, error)

### 🚧 Em Desenvolvimento
- Relatórios Trimestral, Economia e Faturamento (estrutura criada)
- Integração com backend para dados reais
- Sistema de exportação para PDF

### 📋 Próximos Passos
1. **Integração com Backend**
   - Criar services para buscar dados reais
   - Implementar endpoints no backend para cada tipo de relatório
   
2. **Funcionalidades Avançadas**
   - Gráficos interativos (Chart.js ou similar)
   - Filtros por período, condomínio, unidade
   - Sistema de agendamento de relatórios
   
3. **Export e Compartilhamento**
   - Geração de PDF
   - Envio por email
   - Histórico de relatórios gerados

## Como Adicionar um Novo Tipo de Relatório

1. **Criar o componente**:
   ```bash
   mkdir src/app/features/reports/report/novo-relatorio
   # Criar novo-relatorio.component.ts
   ```

2. **Adicionar à lista de tipos** em `reports.component.ts`:
   ```typescript
   {
     id: 'novo-relatorio',
     name: 'Nome do Relatório',
     description: 'Descrição do relatório',
     icon: '📊',
     status: 'development'
   }
   ```

3. **Configurar rota** em `reports.routes.ts`:
   ```typescript
   {
     path: 'novo-relatorio',
     loadComponent: () => import('./report/novo-relatorio/novo-relatorio.component').then(m => m.NovoRelatorioComponent)
   }
   ```

## Padrões de Desenvolvimento

### Interfaces TypeScript
- Sempre definir interfaces para os dados
- Usar tipos union para status (`'available' | 'development' | 'planning'`)
- Evitar `any`, preferir `unknown` ou tipos específicos

### Componentes
- Usar standalone components
- Injeção de dependências com `inject()` em vez de constructor
- Seguir padrões do Angular style guide

### Styling
- Classes CSS semânticas e organizadas
- Responsividade mobile-first
- Usar variáveis CSS para cores e espaçamentos consistentes

### Estados
- Loading states para UX
- Error handling adequado
- Mensagens informativas para o usuário