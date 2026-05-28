export default function TermosPage() {
  return (
    <div className="min-h-screen bg-[#f8f9ff] py-10 px-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl border border-[#c4c6cd] p-8 shadow-sm">
        <div className="mb-6 pb-4 border-b border-[#c4c6cd]">
          <h1 className="text-2xl font-bold text-[#041627]">Termos de Uso e Política de Privacidade</h1>
          <p className="text-sm text-[#44474c] mt-1">Versão v1.0-teste · 27/05/2026</p>
          <div className="mt-2 inline-flex items-center gap-1 bg-yellow-50 border border-yellow-200 text-yellow-700 text-xs px-2 py-1 rounded">
            ⚠️ Documento de teste — sem validade jurídica
          </div>
        </div>

        <div className="prose prose-sm max-w-none text-[#44474c] space-y-6">
          <section>
            <h2 className="text-base font-semibold text-[#041627]">1. Coleta de Dados</h2>
            <p>Ao se cadastrar como prestador de serviço na plataforma ConectAguia, você autoriza a coleta dos seguintes dados pessoais:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Nome completo ou razão social</li>
              <li>CPF ou CNPJ</li>
              <li>E-mail e telefone de contato</li>
              <li>Endereço (opcional)</li>
              <li>Tipo e descrição do serviço prestado</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#041627]">2. Finalidade do Tratamento (LGPD — Art. 7º)</h2>
            <p>Os dados coletados são utilizados exclusivamente para:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Identificação e contato com o prestador de serviço</li>
              <li>Gestão interna da plataforma</li>
              <li>Comunicações relacionadas ao cadastro</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#041627]">3. Compartilhamento</h2>
            <p>Seus dados <strong>não serão vendidos ou compartilhados</strong> com terceiros sem seu consentimento expresso, exceto por obrigação legal.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#041627]">4. Armazenamento e Segurança</h2>
            <p>Os dados são armazenados em ambiente seguro com criptografia. O registro de consentimento (data, hora, IP) é mantido como log imutável conforme exigência da LGPD.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#041627]">5. Seus Direitos (LGPD — Art. 18)</h2>
            <p>Você tem direito a:</p>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Confirmar a existência do tratamento</li>
              <li>Acessar seus dados</li>
              <li>Corrigir dados incompletos ou incorretos</li>
              <li>Solicitar exclusão dos dados tratados com base no consentimento</li>
              <li>Revogar o consentimento a qualquer momento</li>
            </ul>
            <p className="text-sm">Para exercer seus direitos, entre em contato: <strong>lgpd@conectaguia.com.br</strong></p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-[#041627]">6. Consentimento</h2>
            <p>Ao marcar a opção de aceite, você declara ter lido, compreendido e concordado com estes termos.</p>
          </section>

          <div className="pt-4 border-t border-[#c4c6cd] text-xs text-[#74777d]">
            Este documento é um placeholder de teste e será substituído pelo documento jurídico definitivo.
          </div>
        </div>

        <div className="mt-6">
          <a href="/" className="text-[#0054cd] hover:underline text-sm">← Voltar ao cadastro</a>
        </div>
      </div>
    </div>
  );
}
