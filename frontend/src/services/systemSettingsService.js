/**
 * Service para gerenciar configurações do sistema
 * Centraliza acesso às settings do servidor Django
 */

import { apiFetch } from '@/utils/apiFetch.js';

class SystemSettingsService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = new Map();
    this.inFlight = new Map();
    this.cacheDuration = 5 * 60 * 1000; // 5 minutos de cache padrão
  }

  shouldDebugLog() {
    try {
      return import.meta.env.DEV && String(window?.localStorage?.getItem('debug_settings') || '') === '1';
    } catch {
      return false;
    }
  }

  /**
   * Busca todas as configurações do sistema
   * @returns {Promise<Object>} Objeto com todas as settings
   */
  async getAllSettings() {
    const cacheKey = 'all_settings';
    
    // Verificar cache
    if (this.cache.has(cacheKey) && this.cacheExpiry.get(cacheKey) > Date.now()) {
      if (this.shouldDebugLog()) {
        console.log('📦 Usando cache de settings');
      }
      return this.cache.get(cacheKey);
    }

    // Deduplicar requisições concorrentes (ex.: React StrictMode no dev)
    if (this.inFlight.has(cacheKey)) {
      return this.inFlight.get(cacheKey);
    }

    try {
      const requestPromise = (async () => {
        const data = await apiFetch('/system-settings');

        // Armazenar em cache
        this.cache.set(cacheKey, data.settings);
        this.cacheExpiry.set(cacheKey, Date.now() + this.cacheDuration);

        if (this.shouldDebugLog()) {
          console.log('⚙️ Settings carregadas:', data.settings);
        }

        return data.settings;
      })();

      this.inFlight.set(cacheKey, requestPromise);
      return await requestPromise;
    } catch (error) {
      console.error('Erro ao buscar settings:', error);
      
      // Retornar settings padrão em caso de erro
      return this.getDefaultSettings();
    } finally {
      this.inFlight.delete(cacheKey);
    }
  }

  /**
   * Busca uma configuração específica
   * @param {string} key - Chave da configuração
   * @returns {Promise<any>} Valor da configuração
   */
  async getSetting(key) {
    const cacheKey = `setting_${key}`;
    
    // Verificar cache
    if (this.cache.has(cacheKey) && this.cacheExpiry.get(cacheKey) > Date.now()) {
      return this.cache.get(cacheKey);
    }

    try {
      const data = await apiFetch(`/system-settings/${key}`);
      
      // Armazenar em cache
      this.cache.set(cacheKey, data.value);
      this.cacheExpiry.set(cacheKey, Date.now() + this.cacheDuration);
      
      return data.value;
    } catch (error) {
      console.error(`Erro ao buscar setting ${key}:`, error);
      
      // Retornar valor padrão
      const defaults = this.getDefaultSettings();
      return defaults[key];
    }
  }

  /**
   * Verifica se uma configuração está habilitada (true)
   * Útil para flags booleanas
   */
  async isSettingEnabled(key) {
    const value = await this.getSetting(key);
    return Boolean(value);
  }

  /**
   * Gets default settings (fallback em caso de erro)
   */
  getDefaultSettings() {
    return {
      // ===== ALERTAS (PROCESSOS) =====
      'STALE_PROCESS_MONITOR_ENABLED': false,
      'STALE_PROCESS_MONITOR_TIME': '09:00',
      'STALE_PROCESS_DAYS_THRESHOLD': 90,

      // ===== PUBLICAÇÕES =====
      'AUTO_LOAD_PUBLICATIONS_ON_CASE': true,
      'AUTO_LOAD_PUBLICATIONS_ON_CONTACTS': true,
      'AUTO_CREATE_MOVEMENT_ON_PUBLICATION_INTEGRATION': true,
      'HIDE_PUBLICATIONS_TAB_WHEN_AUTO_SYNC': false,
      'PUBLICATION_CACHE_DURATION': 300,
      'PUBLICATIONS_ALLOW_REIMPORT_AFTER_DELETE': true,
      
      // ===== MOVIMENTAÇÕES =====
      'AUTO_LOAD_MOVEMENTS_ON_CASE': true,
      'AUTO_CHECK_DEADLINES': true,
      'DEADLINE_NOTIFICATION_DAYS': 7,
      'DEADLINE_NOTIFICATION_BEFORE_DAYS': 3,
      
      // ===== PARTES =====
      'AUTO_LOAD_PARTIES_ON_CASE': true,
      'ALLOW_MULTIPLE_ROLES_PER_CONTACT': true,
      
      // ===== PAGAMENTOS E DESPESAS =====
      'AUTO_LOAD_PAYMENTS_ON_CASE': true,
      'AUTO_LOAD_EXPENSES_ON_CASE': true,
      
      // ===== INTERFACE E UX =====
      'AUTO_LOAD_DOCUMENTS_ON_CASE': true,
      'ENABLE_SOFT_DELETE': true,
      'DEFAULT_PAGE_SIZE': 20,
      'MAX_RESULTS_PER_SEARCH': 100,
      
      // ===== SISTEMA =====
      'ENVIRONMENT': 'development',
      'DEBUG_MODE': false,
      'LOG_API_REQUESTS': false,
    };
  }

  /**
   * Atualiza múltiplas configurações editáveis do sistema.
   * @param {Object} settingsPatch - ex.: { STALE_PROCESS_MONITOR_TIME: '09:00' }
   * @returns {Promise<Object>} settings mescladas após update
   */
  async updateSettings(settingsPatch) {
    const data = await apiFetch('/system-settings', {
      method: 'PATCH',
      body: JSON.stringify({ settings: settingsPatch }),
    });

    // Atualização bem-sucedida: invalidar cache
    this.clearCache();

    // Retornar settings completas, se disponíveis
    return data?.settings || null;
  }

  /**
   * Atualiza uma configuração específica.
   */
  async updateSetting(key, value) {
    const data = await apiFetch(`/system-settings/${key}`, {
      method: 'PATCH',
      body: JSON.stringify({ value }),
    });

    this.clearCache();
    return data?.value;
  }

  /**
   * Limpa o cache de settings
   * Útil quando settings são atualizadas
   */
  clearCache() {
    this.cache.clear();
    this.cacheExpiry.clear();
    console.log('🗑️ Cache de settings limpo');
  }

  /**
   * Atualiza a duração do cache em milissegundos
   */
  setCacheDuration(durationMs) {
    this.cacheDuration = durationMs;
  }
}

// Exportar instância singleton
export default new SystemSettingsService();
