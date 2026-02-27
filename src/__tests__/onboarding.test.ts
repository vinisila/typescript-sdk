import { KondutoBVS } from '../KondutoBVS';
import { KondutoDefine } from '../KondutoDefine';
import { KondutoResolucao6 } from '../KondutoResolucao6';
import { KondutoBVSException } from '../exceptions/KondutoBVSException';
import { KondutoDefineException } from '../exceptions/KondutoDefineException';
import { KondutoResolucao6Exception } from '../exceptions/KondutoResolucao6Exception';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeMockResponse(status: number, body: unknown, isXml = false): Response {
  const text = isXml ? (body as string) : JSON.stringify(body);
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => text,
  } as unknown as Response;
}

// ─── KondutoBVS — constructor ────────────────────────────────────────────────

describe('KondutoBVS constructor', () => {
  it('accepts valid user and password', () => {
    expect(() => new KondutoBVS('12345678', 'pass12')).not.toThrow();
  });

  it('throws RangeError when user exceeds 8 chars', () => {
    expect(() => new KondutoBVS('123456789', 'pass')).toThrow(RangeError);
  });

  it('throws RangeError when user is empty', () => {
    expect(() => new KondutoBVS('', 'pass')).toThrow(RangeError);
  });

  it('throws RangeError when password exceeds 6 chars', () => {
    expect(() => new KondutoBVS('user01', 'toolong')).toThrow(RangeError);
  });

  it('throws RangeError when password is empty', () => {
    expect(() => new KondutoBVS('user01', '')).toThrow(RangeError);
  });
});

// ─── KondutoBVS — validaJson ─────────────────────────────────────────────────

describe('KondutoBVS.validaJson()', () => {
  let bvs: KondutoBVS;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    bvs = new KondutoBVS('user01', 'pass01');
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => fetchSpy.mockRestore());

  it('sends POST to the correct URL with user/password headers', async () => {
    const apiResponse = { cadastroBasico: { cpf: '12345678909', nome: 'Jane Doe' } };
    fetchSpy.mockResolvedValueOnce(makeMockResponse(200, apiResponse));

    const result = await bvs.validaJson({ cpf: '12345678909', modules: 'CB' });

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://consumer.bvsnet.com.br/dadoscadastrais/v01/people/search');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['user']).toBe('user01');
    expect(headers['password']).toBe('pass01');
    expect(headers['content-type']).toBe('application/json');

    expect(result.cadastroBasico?.nome).toBe('Jane Doe');
  });

  it('sends the correct request body', async () => {
    fetchSpy.mockResolvedValueOnce(makeMockResponse(200, {}));
    await bvs.validaJson({ cpf: '12345678909', name: 'Jane', dateOfBirth: '01/01/1990', modules: 'CB,CC' });

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.cpf).toBe('12345678909');
    expect(body.modules).toBe('CB,CC');
    expect(body.dateOfBirth).toBe('01/01/1990');
  });

  it('throws KondutoBVSException on application error', async () => {
    fetchSpy.mockResolvedValueOnce(
      makeMockResponse(400, { codigo: 'INVALID_CPF', mensagem: 'CPF inválido' })
    );

    await expect(bvs.validaJson({ cpf: 'bad', modules: 'CB' })).rejects.toMatchObject({
      name: 'KondutoBVSException',
      codigo: 'INVALID_CPF',
    });
  });

  it('throws HTTP exception when BVS error body is absent', async () => {
    fetchSpy.mockResolvedValueOnce(makeMockResponse(401, 'Unauthorized'));

    await expect(bvs.validaJson({ cpf: '12345678909', modules: 'CB' })).rejects.toMatchObject({
      name: 'KondutoHTTPUnauthorizedException',
    });
  });
});

// ─── KondutoBVS — validaMais ─────────────────────────────────────────────────

describe('KondutoBVS.validaMais()', () => {
  let bvs: KondutoBVS;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    bvs = new KondutoBVS('user01', 'pass01');
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => fetchSpy.mockRestore());

  it('sends POST to the card validation endpoint', async () => {
    const apiResponse = {
      cpf: '12345678909', bin: '527468', last_four: '1234',
      card_brand: 'MASTERCARD', bank: 'NU PAGAMENTOS SA',
      score: 3, relationshipdg: 'VINCULO MEDIO',
    };
    fetchSpy.mockResolvedValueOnce(makeMockResponse(200, apiResponse));

    const result = await bvs.validaMais({ cpf: '12345678909', bin: '527468', last_four: '1234' });

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://consumer.bvsnet.com.br/valida/v01/cartao');
    expect(result.score).toBe(3);
    expect(result.relationshipdg).toBe('VINCULO MEDIO');
    expect(result.card_brand).toBe('MASTERCARD');
  });

  it('returns score=-1 for a deceased CPF', async () => {
    const apiResponse = {
      cpf: '12345678909', bin: '550209', last_four: '1234',
      card_brand: 'MASTERCARD', bank: 'NU PAGAMENTOS SA',
      score: -1, relationshipdg: 'OBITO',
    };
    fetchSpy.mockResolvedValueOnce(makeMockResponse(200, apiResponse));

    const result = await bvs.validaMais({ cpf: '12345678909', bin: '550209', last_four: '1234' });
    expect(result.score).toBe(-1);
    expect(result.relationshipdg).toBe('OBITO');
  });

  it('throws KondutoBVSException on INVALID_BIN error', async () => {
    fetchSpy.mockResolvedValueOnce(
      makeMockResponse(400, { codigo: 'INVALID_BIN', mensagem: 'Bin inválido' })
    );

    await expect(
      bvs.validaMais({ cpf: '12345678909', bin: 'bad', last_four: '1234' })
    ).rejects.toMatchObject({ name: 'KondutoBVSException', codigo: 'INVALID_BIN' });
  });
});

// ─── KondutoBVS — validaMaisCadastro ─────────────────────────────────────────

describe('KondutoBVS.validaMaisCadastro()', () => {
  let bvs: KondutoBVS;
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    bvs = new KondutoBVS('user01', 'pass01');
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => fetchSpy.mockRestore());

  it('sends POST to the cadastro validation endpoint', async () => {
    const apiResponse = {
      cpf: '12345678909', score: 5, relationshipdg: 'HIGH',
      combinationData: { name: true, phone: true, zipCode: true, email: true, motherName: true, death: false, underage: false },
    };
    fetchSpy.mockResolvedValueOnce(makeMockResponse(200, apiResponse));

    const result = await bvs.validaMaisCadastro({
      cpf: '12345678909', name: 'Jane Doe', email: 'jane@example.com',
    });

    const [url] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://consumer.bvsnet.com.br/valida/v01/cadastro');
    expect(result.score).toBe(5);
    expect(result.combinationData.name).toBe(true);
    expect(result.combinationData.death).toBe(false);
  });

  it('sends only the fields present in the request', async () => {
    fetchSpy.mockResolvedValueOnce(
      makeMockResponse(200, { cpf: '12345678909', score: 0, relationshipdg: 'NO MATCH',
        combinationData: { name: false, phone: false, zipCode: false, email: false, motherName: false, death: false, underage: false } })
    );

    await bvs.validaMaisCadastro({ cpf: '12345678909' });
    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.cpf).toBe('12345678909');
    expect(body.name).toBeUndefined();
  });
});

// ─── KondutoDefine — buildXml ─────────────────────────────────────────────────

describe('KondutoDefine.buildXml()', () => {
  it('builds minimal XML with required fields only', () => {
    const xml = KondutoDefine.buildXml({
      usuario: 'myuser', senha: 'mypass', cnpj: '12345678000195',
    });
    expect(xml).toContain('<usuario>myuser</usuario>');
    expect(xml).toContain('<senha>mypass</senha>');
    expect(xml).toContain('<cnpj>12345678000195</cnpj>');
    expect(xml).not.toContain('<opcionais>');
    expect(xml).not.toContain('<extras>');
  });

  it('includes opcionais block when requested', () => {
    const xml = KondutoDefine.buildXml({
      usuario: 'u', senha: 'p', cnpj: '12345678000195',
      opcionais: { quadroSocial: true, faturamento: true },
    });
    expect(xml).toContain('<opcionais>');
    expect(xml).toContain('<quadroSocial/>');
    expect(xml).toContain('<faturamento/>');
    expect(xml).not.toContain('<participacoes/>');
  });

  it('includes extras block when requested', () => {
    const xml = KondutoDefine.buildXml({
      usuario: 'u', senha: 'p', cnpj: '12345678000195',
      opcionais: { quadroSocial: true },
      extras: { socios: true },
    });
    expect(xml).toContain('<extras>');
    expect(xml).toContain('<socios/>');
    expect(xml).not.toContain('<administradores/>');
  });

  it('escapes XML special characters in credentials', () => {
    const xml = KondutoDefine.buildXml({
      usuario: 'user&test', senha: 'p<ass>', cnpj: '12345678000195',
    });
    expect(xml).toContain('<usuario>user&amp;test</usuario>');
    expect(xml).toContain('<senha>p&lt;ass&gt;</senha>');
  });
});

// ─── KondutoDefine — defineCadastro ──────────────────────────────────────────

describe('KondutoDefine.defineCadastro()', () => {
  let define: KondutoDefine;
  let fetchSpy: jest.SpyInstance;

  const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<retorno>
  <cnpj>12345678000195</cnpj>
  <razaoSocial>EMPRESA TESTE LTDA</razaoSocial>
  <nomeFantasia>EMPRESA TESTE</nomeFantasia>
  <situacaoCnpj>ATIVA</situacaoCnpj>
  <logradouro>Rua das Flores</logradouro>
  <municipio>São Paulo</municipio>
  <uf>SP</uf>
  <cep>01001001</cep>
</retorno>`;

  beforeEach(() => {
    define = new KondutoDefine();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => fetchSpy.mockRestore());

  it('sends POST with application/xml content-type', async () => {
    fetchSpy.mockResolvedValueOnce(makeMockResponse(200, sampleXml, true));

    await define.defineCadastro({ usuario: 'u', senha: 'p', cnpj: '12345678000195' });

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://define.bvsnet.com.br/DefineXml/servicos/defineCadastro/v5');
    expect(init.method).toBe('POST');
    const headers = init.headers as Record<string, string>;
    expect(headers['content-type']).toContain('application/xml');
  });

  it('parses the XML response into structured fields', async () => {
    fetchSpy.mockResolvedValueOnce(makeMockResponse(200, sampleXml, true));

    const result = await define.defineCadastro({ usuario: 'u', senha: 'p', cnpj: '12345678000195' });

    expect(result.rawXml).toBe(sampleXml);
    expect(result.identificacao?.cnpj).toBe('12345678000195');
    expect(result.identificacao?.razaoSocial).toBe('EMPRESA TESTE LTDA');
    expect(result.identificacao?.situacaoCnpj).toBe('ATIVA');
    expect(result.localizacao?.municipio).toBe('São Paulo');
    expect(result.localizacao?.uf).toBe('SP');
  });

  it('throws KondutoDefineException on HTTP error', async () => {
    const errorXml = '<erro><codigo>050</codigo><mensagem>CNPJ inválido</mensagem></erro>';
    fetchSpy.mockResolvedValueOnce(makeMockResponse(400, errorXml, true));

    await expect(
      define.defineCadastro({ usuario: 'u', senha: 'p', cnpj: 'bad' })
    ).rejects.toMatchObject({ name: 'KondutoDefineException', code: '050' });
  });

  it('throws KondutoDefineException with HTTP status code when XML has no <codigo>', async () => {
    fetchSpy.mockResolvedValueOnce(makeMockResponse(403, 'xml inválido', true));

    await expect(
      define.defineCadastro({ usuario: 'u', senha: 'p', cnpj: '12345678000195' })
    ).rejects.toMatchObject({ name: 'KondutoDefineException', code: '403' });
  });
});

// ─── KondutoResolucao6 — constructor ─────────────────────────────────────────

describe('KondutoResolucao6 constructor', () => {
  it('throws when accessCode is missing', () => {
    expect(() => new KondutoResolucao6('', 'secret', 'key')).toThrow('accessCode is required');
  });

  it('throws when secretId is missing', () => {
    expect(() => new KondutoResolucao6('code', '', 'key')).toThrow('secretId is required');
  });

  it('throws when privateKey is missing', () => {
    expect(() => new KondutoResolucao6('code', 'secret', '')).toThrow('privateKey is required');
  });

  it('accepts valid credentials', () => {
    expect(() => new KondutoResolucao6('code', 'secret', 'privateKey')).not.toThrow();
  });
});

// ─── KondutoResolucao6 — consulta ────────────────────────────────────────────

describe('KondutoResolucao6.consulta()', () => {
  let r6: KondutoResolucao6;
  let fetchSpy: jest.SpyInstance;

  // Use a real RSA key pair for testing signature generation
  const { generateKeyPairSync } = require('crypto') as typeof import('crypto');
  const { privateKey: testPrivateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
  const testPrivateKeyPem = testPrivateKey.export({ type: 'pkcs8', format: 'pem' }) as string;

  beforeEach(() => {
    r6 = new KondutoResolucao6('ACC123', 'SEC456', testPrivateKeyPem);
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => fetchSpy.mockRestore());

  it('sends POST to the correct URL with required headers', async () => {
    const apiResponse = { returnAntiFraude: [] };
    fetchSpy.mockResolvedValueOnce(makeMockResponse(200, apiResponse));

    await r6.consulta({ produto: 'RC6', versao: 'v1', documento: '08880787063' });

    const [url, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    expect(url).toBe('https://api.boavistascpc.com.br/orquestrador/v1/consulta');
    expect(init.method).toBe('POST');

    const headers = init.headers as Record<string, string>;
    expect(headers['accessCode']).toBe('ACC123');
    expect(headers['secretId']).toBe('SEC456');
    expect(typeof headers['signature']).toBe('string');
    expect(headers['signature'].length).toBeGreaterThan(0);
    expect(headers['content-type']).toBe('application/json');
  });

  it('includes the correct request body', async () => {
    fetchSpy.mockResolvedValueOnce(makeMockResponse(200, { returnAntiFraude: [] }));

    await r6.consulta({ produto: 'RC6', versao: 'v1', documento: '08880787063' });

    const [, init] = fetchSpy.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(init.body as string);
    expect(body.produto).toBe('RC6');
    expect(body.versao).toBe('v1');
    expect(body.documento).toBe('08880787063');
  });

  it('returns the parsed response', async () => {
    const apiResponse = {
      returnAntiFraude: [
        {
          documento: '08880787063',
          tipoDocumento: 1,
          metadata: { versaoAPI: 'v1' },
          ocorrencias: [
            {
              registro: {
                atividadeRelacionada: 4,
                canal: 2,
                classificacao: 1,
                valorTransacao: 5000.0,
              },
            },
          ],
        },
      ],
    };
    fetchSpy.mockResolvedValueOnce(makeMockResponse(200, apiResponse));

    const result = await r6.consulta({ produto: 'RC6', versao: 'v1', documento: '08880787063' });
    expect(result.returnAntiFraude).toHaveLength(1);
    expect(result.returnAntiFraude[0].tipoDocumento).toBe(1);
    expect(result.returnAntiFraude[0].ocorrencias[0].registro?.classificacao).toBe(1);
  });

  it('throws KondutoResolucao6Exception on MSAUT01 error', async () => {
    fetchSpy.mockResolvedValueOnce(
      makeMockResponse(400, {
        data: '2022-02-10T13:42:36.845+00:00',
        codigo: 'MSAUT01',
        erro: 'Bad Request',
        mensagem: 'Requisição inválida.',
      })
    );

    await expect(
      r6.consulta({ produto: 'RC6', versao: 'v1', documento: 'bad' })
    ).rejects.toMatchObject({ name: 'KondutoResolucao6Exception', codigo: 'MSAUT01' });
  });

  it('generates a different signature per documento', async () => {
    fetchSpy.mockResolvedValue(makeMockResponse(200, { returnAntiFraude: [] }));

    await r6.consulta({ produto: 'RC6', versao: 'v1', documento: '11111111111' });
    await r6.consulta({ produto: 'RC6', versao: 'v1', documento: '22222222222' });

    const sig1 = (fetchSpy.mock.calls[0][1] as RequestInit).headers as Record<string, string>;
    const sig2 = (fetchSpy.mock.calls[1][1] as RequestInit).headers as Record<string, string>;
    expect(sig1['signature']).not.toBe(sig2['signature']);
  });
});

// ─── Exception classes ───────────────────────────────────────────────────────

describe('New exception classes', () => {
  it('KondutoBVSException stores codigo and extends KondutoException', () => {
    const ex = new KondutoBVSException('INVALID_CPF', 'CPF inválido');
    expect(ex).toBeInstanceOf(Error);
    expect(ex.name).toBe('KondutoBVSException');
    expect(ex.codigo).toBe('INVALID_CPF');
    expect(ex.message).toContain('INVALID_CPF');
    expect(ex.message).toContain('CPF inválido');
  });

  it('KondutoDefineException stores code and rawResponse', () => {
    const ex = new KondutoDefineException('050', '<raw xml>');
    expect(ex.name).toBe('KondutoDefineException');
    expect(ex.code).toBe('050');
    expect(ex.rawResponse).toBe('<raw xml>');
  });

  it('KondutoResolucao6Exception stores codigo and rawResponse', () => {
    const ex = new KondutoResolucao6Exception('MSAUT03', 'Unauthorized', '{"raw":"json"}');
    expect(ex.name).toBe('KondutoResolucao6Exception');
    expect(ex.codigo).toBe('MSAUT03');
    expect(ex.rawResponse).toBe('{"raw":"json"}');
    expect(ex.message).toContain('MSAUT03');
  });
});
