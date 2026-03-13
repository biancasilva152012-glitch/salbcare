/**
 * Generates an ABRASF-compliant JSON for NFS-e (Nota Fiscal de Serviço Eletrônica).
 * Based on ABRASF v2.04 standard used by Brazilian municipalities.
 */

interface InvoiceData {
  id: string;
  patient_name: string;
  cpf_cnpj: string;
  service: string;
  service_code: string;
  amount: number;
  iss_rate: number;
  date: string;
  payment_method: string;
  address_street: string;
  address_number: string;
  address_complement?: string | null;
  address_neighborhood: string;
  address_city: string;
  address_state: string;
  address_zip: string;
}

interface ProviderData {
  name: string;
  email: string;
  cpf_cnpj?: string;
  city?: string;
}

function formatCpfCnpj(value: string): string {
  return value.replace(/\D/g, "");
}

function formatCep(value: string): string {
  return value.replace(/\D/g, "");
}

function getIbgeCityCode(city: string, state: string): string {
  // Placeholder — in production, map city+state to IBGE code
  return "0000000";
}

export function generateAbrasfJson(invoice: InvoiceData, provider: ProviderData) {
  const cpfCnpjClean = formatCpfCnpj(invoice.cpf_cnpj);
  const isCnpj = cpfCnpjClean.length > 11;
  const issValue = (invoice.amount * invoice.iss_rate) / 100;
  const baseCalculo = invoice.amount;

  const nfse = {
    InfDeclaracaoPrestacaoServico: {
      "@Id": `NFS-${invoice.id.substring(0, 8).toUpperCase()}`,
      Competencia: invoice.date.substring(0, 7).replace("-", ""),
      Rps: {
        IdentificacaoRps: {
          Numero: invoice.id.substring(0, 8),
          Serie: "NF",
          Tipo: 1, // 1 = RPS
        },
        DataEmissao: invoice.date,
        Status: 1, // 1 = Normal
      },
      Servico: {
        Valores: {
          ValorServicos: baseCalculo.toFixed(2),
          ValorDeducoes: "0.00",
          ValorPis: "0.00",
          ValorCofins: "0.00",
          ValorInss: "0.00",
          ValorIr: "0.00",
          ValorCsll: "0.00",
          IssRetido: 2, // 2 = Não retido
          ValorIss: issValue.toFixed(2),
          BaseCalculo: baseCalculo.toFixed(2),
          Aliquota: (invoice.iss_rate / 100).toFixed(4),
          ValorLiquidoNfse: (baseCalculo - issValue).toFixed(2),
        },
        ItemListaServico: invoice.service_code,
        CodigoTributacaoMunicipio: invoice.service_code,
        Discriminacao: invoice.service,
        CodigoMunicipio: getIbgeCityCode(invoice.address_city, invoice.address_state),
        ExigibilidadeISS: 1, // 1 = Exigível
        MunicipioIncidencia: getIbgeCityCode(invoice.address_city, invoice.address_state),
      },
      Prestador: {
        CpfCnpj: provider.cpf_cnpj
          ? { [provider.cpf_cnpj.replace(/\D/g, "").length > 11 ? "Cnpj" : "Cpf"]: provider.cpf_cnpj.replace(/\D/g, "") }
          : {},
        RazaoSocial: provider.name,
        Contato: {
          Email: provider.email,
        },
      },
      Tomador: {
        IdentificacaoTomador: {
          CpfCnpj: {
            [isCnpj ? "Cnpj" : "Cpf"]: cpfCnpjClean,
          },
        },
        RazaoSocial: invoice.patient_name,
        Endereco: {
          Endereco: invoice.address_street,
          Numero: invoice.address_number,
          Complemento: invoice.address_complement || "",
          Bairro: invoice.address_neighborhood,
          CodigoMunicipio: getIbgeCityCode(invoice.address_city, invoice.address_state),
          Uf: invoice.address_state,
          Cep: formatCep(invoice.address_zip),
        },
      },
      OptanteSimplesNacional: 1, // 1 = Sim
      IncentivoFiscal: 2, // 2 = Não
      InformacoesComplementares: `Pagamento: ${invoice.payment_method}`,
    },
  };

  return nfse;
}

export function downloadAbrasfJson(invoice: InvoiceData, provider: ProviderData) {
  const json = generateAbrasfJson(invoice, provider);
  const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `nfse-${invoice.patient_name.toLowerCase().replace(/\s+/g, "-")}-${invoice.date}.json`;
  a.click();
  URL.revokeObjectURL(url);
}
