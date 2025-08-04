// Estado global de la aplicación
let appState = {
    isPublishing: false,
    currentProgress: 0,
    totalProducts: 0,
    publishedToday: 0,
    errors: [],
    lastUpdate: new Date(),
    accounts: [],
    isConnected: false
};

// Elementos del DOM
const elements = {
    // Tabs
    tabButtons: document.querySelectorAll('.tab-button'),
    tabContents: document.querySelectorAll('.tab-content'),
    
    // Status
    connectionStatus: document.getElementById('connectionStatus'),
    
    // Dashboard
    publishedToday: document.getElementById('publishedToday'),
    totalProducts: document.getElementById('totalProducts'),
    activeAccounts: document.getElementById('activeAccounts'),
    errorCount: document.getElementById('errorCount'),
    
    // Buttons
    startPublishing: document.getElementById('startPublishing'),
    stopPublishing: document.getElementById('stopPublishing'),
    startPublishingMain: document.getElementById('startPublishingMain'),
    stopPublishingMain: document.getElementById('stopPublishingMain'),
    pausePublishing: document.getElementById('pausePublishing'),
    
    // Progress
    progressSection: document.getElementById('progressSection'),
    progressText: document.getElementById('progressText'),
    progressPercentage: document.getElementById('progressPercentage'),
    progressFill: document.getElementById('progressFill'),
    currentStatus: document.getElementById('currentStatus'),
    
    // Activity
    activityList: document.getElementById('activityList'),
    
    // Google Sheets
    authorizeGoogle: document.getElementById('authorizeGoogle'),
    testConnection: document.getElementById('testConnection'),
    previewProducts: document.getElementById('previewProducts'),
    authStatus: document.getElementById('authStatus'),
    connectionResult: document.getElementById('connectionResult'),
    productsPreview: document.getElementById('productsPreview'),
    
    // Data Sources
    dataSourceRadios: document.querySelectorAll('input[name="dataSource"]'),
    googleSheetsSection: document.getElementById('googleSheetsSection'),
    excelSection: document.getElementById('excelSection'),
    
    // Excel
    excelUploadArea: document.getElementById('excelUploadArea'),
    excelFileInput: document.getElementById('excelFileInput'),
    uploadExcelBtn: document.getElementById('uploadExcelBtn'),
    excelInfoCard: document.getElementById('excelInfoCard'),
    excelInfo: document.getElementById('excelInfo'),
    validateExcelBtn: document.getElementById('validateExcelBtn'),
    clearExcelBtn: document.getElementById('clearExcelBtn'),
    
    // Accounts
    addAccountForm: document.getElementById('addAccountForm'),
    accountsList: document.getElementById('accountsList'),
    
    // Publish Status
    currentPublishStatus: document.getElementById('currentPublishStatus'),
    publishProgress: document.getElementById('publishProgress'),
    currentAccount: document.getElementById('currentAccount'),
    lastUpdate: document.getElementById('lastUpdate'),
    
    // Logs
    refreshLogs: document.getElementById('refreshLogs'),
    downloadReport: document.getElementById('downloadReport'),
    logsFilter: document.getElementById('logsFilter'),
    logsContent: document.getElementById('logsContent'),
    
    // Modal
    loadingModal: document.getElementById('loadingModal'),
    loadingMessage: document.getElementById('loadingMessage'),
    
    // Toast
    toastContainer: document.getElementById('toastContainer')
};

// Inicialización
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    startStatusPolling();
});

// Configurar event listeners
function setupEventListeners() {
    // Tabs
    elements.tabButtons.forEach(button => {
        button.addEventListener('click', () => switchTab(button.dataset.tab));
    });

    // Publishing buttons
    if (elements.startPublishing) {
        elements.startPublishing.addEventListener('click', startPublishing);
    }
    if (elements.stopPublishing) {
        elements.stopPublishing.addEventListener('click', stopPublishing);
    }
    if (elements.startPublishingMain) {
        elements.startPublishingMain.addEventListener('click', startPublishing);
    }
    if (elements.stopPublishingMain) {
        elements.stopPublishingMain.addEventListener('click', stopPublishing);
    }

    // Data Sources
    elements.dataSourceRadios.forEach(radio => {
        radio.addEventListener('change', switchDataSource);
    });

    // Google Sheets
    if (elements.authorizeGoogle) {
        elements.authorizeGoogle.addEventListener('click', authorizeGoogleSheets);
    }
    if (elements.testConnection) {
        elements.testConnection.addEventListener('click', testGoogleSheetsConnection);
    }
    if (elements.previewProducts) {
        elements.previewProducts.addEventListener('click', previewProducts);
    }

    // Excel
    if (elements.uploadExcelBtn) {
        elements.uploadExcelBtn.addEventListener('click', () => elements.excelFileInput.click());
    }
    if (elements.excelFileInput) {
        elements.excelFileInput.addEventListener('change', handleExcelFileSelect);
    }
    if (elements.excelUploadArea) {
        setupExcelDragAndDrop();
    }
    if (elements.validateExcelBtn) {
        elements.validateExcelBtn.addEventListener('click', validateExcelFile);
    }
    if (elements.clearExcelBtn) {
        elements.clearExcelBtn.addEventListener('click', clearExcelData);
    }

    // Accounts
    if (elements.addAccountForm) {
        elements.addAccountForm.addEventListener('submit', addAccount);
    }

    // Logs
    if (elements.refreshLogs) {
        elements.refreshLogs.addEventListener('click', refreshLogs);
    }
    if (elements.downloadReport) {
        elements.downloadReport.addEventListener('click', downloadReport);
    }
    if (elements.logsFilter) {
        elements.logsFilter.addEventListener('change', filterLogs);
    }

    // Check URL params for auth callback
    checkAuthParams();
}

// Inicializar aplicación
async function initializeApp() {
    try {
        // Cargar estado inicial
        await loadAppStatus();
        await loadAccounts();
        
        // Verificar conexión a Google Sheets
        await checkGoogleSheetsAuth();
        
        addActivity('Sistema iniciado correctamente', 'success');
        updateConnectionStatus(true);
        
    } catch (error) {
        console.error('Error al inicializar aplicación:', error);
        addActivity('Error al inicializar sistema', 'error');
        showToast('Error al inicializar aplicación', 'error');
    }
}

// Polling de estado
function startStatusPolling() {
    setInterval(async () => {
        try {
            await loadAppStatus();
        } catch (error) {
            console.error('Error en polling de estado:', error);
            updateConnectionStatus(false);
        }
    }, 2000); // Cada 2 segundos
}

// Cargar estado de la aplicación
async function loadAppStatus() {
    try {
        const response = await fetch('/api/status');
        if (!response.ok) throw new Error('Error al cargar estado');
        
        const status = await response.json();
        updateDashboard(status);
        updatePublishStatus(status);
        
        appState = { ...appState, ...status };
        updateConnectionStatus(true);
        
    } catch (error) {
        updateConnectionStatus(false);
        throw error;
    }
}

// Actualizar dashboard
function updateDashboard(status) {
    if (elements.publishedToday) {
        elements.publishedToday.textContent = status.publishedToday || 0;
    }
    if (elements.totalProducts) {
        elements.totalProducts.textContent = status.totalProducts || 0;
    }
    if (elements.activeAccounts) {
        elements.activeAccounts.textContent = status.accounts?.length || 0;
    }
    if (elements.errorCount) {
        elements.errorCount.textContent = status.errors?.length || 0;
    }

    // Actualizar progreso si está publicando
    if (status.isPublishing) {
        showProgress(status);
    } else {
        hideProgress();
    }

    // Actualizar botones
    updatePublishingButtons(status.isPublishing);
}

// Actualizar estado de publicación
function updatePublishStatus(status) {
    if (elements.currentPublishStatus) {
        elements.currentPublishStatus.textContent = status.isPublishing ? 'Publicando' : 'Detenido';
    }
    if (elements.publishProgress) {
        elements.publishProgress.textContent = `${status.currentProgress || 0}/${status.totalProducts || 0}`;
    }
    if (elements.currentAccount) {
        elements.currentAccount.textContent = status.currentAccount || 'Ninguna';
    }
    if (elements.lastUpdate) {
        elements.lastUpdate.textContent = status.lastUpdate ? 
            new Date(status.lastUpdate).toLocaleString() : '-';
    }
}

// Mostrar progreso
function showProgress(status) {
    if (elements.progressSection) {
        elements.progressSection.style.display = 'block';
        
        const percentage = status.totalProducts > 0 ? 
            Math.round((status.currentProgress / status.totalProducts) * 100) : 0;
        
        if (elements.progressText) {
            elements.progressText.textContent = `Procesando producto ${status.currentProgress} de ${status.totalProducts}`;
        }
        if (elements.progressPercentage) {
            elements.progressPercentage.textContent = `${percentage}%`;
        }
        if (elements.progressFill) {
            elements.progressFill.style.width = `${percentage}%`;
        }
        if (elements.currentStatus) {
            elements.currentStatus.textContent = status.isPublishing ? 
                'Publicando productos automáticamente...' : 
                'Preparando publicación...';
        }
    }
}

// Ocultar progreso
function hideProgress() {
    if (elements.progressSection) {
        elements.progressSection.style.display = 'none';
    }
}

// Actualizar botones de publicación
function updatePublishingButtons(isPublishing) {
    const startButtons = [elements.startPublishing, elements.startPublishingMain];
    const stopButtons = [elements.stopPublishing, elements.stopPublishingMain];
    
    startButtons.forEach(btn => {
        if (btn) {
            btn.disabled = isPublishing;
        }
    });
    
    stopButtons.forEach(btn => {
        if (btn) {
            btn.disabled = !isPublishing;
        }
    });
}

// Cambiar tab
function switchTab(tabName) {
    // Actualizar botones
    elements.tabButtons.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Actualizar contenido
    elements.tabContents.forEach(content => {
        content.classList.toggle('active', content.id === tabName);
    });
    
    // Cargar datos específicos del tab
    switch (tabName) {
        case 'accounts':
            loadAccounts();
            break;
        case 'logs':
            refreshLogs();
            break;
    }
}

// Iniciar publicación
async function startPublishing() {
    try {
        showLoading('Iniciando publicación masiva...');
        
        const response = await fetch('/api/start-publishing', {
            method: 'POST'
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            showToast('Publicación masiva iniciada', 'success');
            addActivity('Publicación masiva iniciada', 'success');
        } else {
            showToast(result.error || 'Error al iniciar publicación', 'error');
        }
        
    } catch (error) {
        hideLoading();
        showToast('Error al iniciar publicación', 'error');
        console.error('Error:', error);
    }
}

// Detener publicación
async function stopPublishing() {
    try {
        showLoading('Deteniendo publicación...');
        
        const response = await fetch('/api/stop-publishing', {
            method: 'POST'
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            showToast('Publicación detenida', 'warning');
            addActivity('Publicación detenida por el usuario', 'warning');
        } else {
            showToast(result.error || 'Error al detener publicación', 'error');
        }
        
    } catch (error) {
        hideLoading();
        showToast('Error al detener publicación', 'error');
        console.error('Error:', error);
    }
}

// Autorizar Google Sheets
async function authorizeGoogleSheets() {
    try {
        showLoading('Obteniendo URL de autorización...');
        
        const response = await fetch('/api/auth/google');
        const result = await response.json();
        
        hideLoading();
        
        if (result.authUrl) {
            // Abrir en nueva ventana
            window.open(result.authUrl, '_blank');
            showToast('Sigue las instrucciones en la nueva ventana', 'info');
        } else {
            showToast('Error al generar URL de autorización', 'error');
        }
        
    } catch (error) {
        hideLoading();
        showToast('Error al autorizar Google Sheets', 'error');
        console.error('Error:', error);
    }
}

// Verificar parámetros de auth en URL
function checkAuthParams() {
    const urlParams = new URLSearchParams(window.location.search);
    const auth = urlParams.get('auth');
    
    if (auth === 'success') {
        showToast('Autorización de Google Sheets exitosa', 'success');
        addActivity('Google Sheets autorizado correctamente', 'success');
        checkGoogleSheetsAuth();
        
        // Limpiar URL
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (auth === 'error') {
        showToast('Error en autorización de Google Sheets', 'error');
        addActivity('Error en autorización de Google Sheets', 'error');
        
        // Limpiar URL
        window.history.replaceState({}, document.title, window.location.pathname);
    }
}

// Verificar auth de Google Sheets
async function checkGoogleSheetsAuth() {
    try {
        const response = await fetch('/api/test-sheets');
        const result = await response.json();
        
        if (result.success) {
            updateAuthStatus(true, result.data);
        } else {
            updateAuthStatus(false);
        }
        
    } catch (error) {
        updateAuthStatus(false);
    }
}

// Actualizar estado de autorización
function updateAuthStatus(isAuthorized, data = null) {
    if (elements.authStatus) {
        const icon = elements.authStatus.querySelector('i');
        const text = elements.authStatus.querySelector('span');
        
        if (isAuthorized) {
            icon.className = 'fas fa-check-circle text-success';
            text.textContent = data ? `Conectado: ${data.title}` : 'Autorizado';
            elements.authStatus.style.background = '#f0fff4';
            elements.authStatus.style.color = '#2f855a';
        } else {
            icon.className = 'fas fa-times-circle text-danger';
            text.textContent = 'No autorizado';
            elements.authStatus.style.background = '#fed7d7';
            elements.authStatus.style.color = '#c53030';
        }
    }
}

// Probar conexión a Google Sheets
async function testGoogleSheetsConnection() {
    try {
        showLoading('Probando conexión...');
        
        const response = await fetch('/api/test-sheets');
        const result = await response.json();
        
        hideLoading();
        
        if (elements.connectionResult) {
            elements.connectionResult.style.display = 'block';
            
            if (result.success) {
                elements.connectionResult.className = 'connection-result success';
                elements.connectionResult.innerHTML = `
                    <strong>Conexión exitosa</strong><br>
                    Hoja: ${result.data.title}<br>
                    URL: <a href="${result.data.url}" target="_blank">Abrir hoja</a>
                `;
                showToast('Conexión a Google Sheets exitosa', 'success');
                updateAuthStatus(true, result.data);
            } else {
                elements.connectionResult.className = 'connection-result error';
                elements.connectionResult.textContent = result.error || 'Error de conexión';
                showToast('Error en conexión a Google Sheets', 'error');
                updateAuthStatus(false);
            }
        }
        
    } catch (error) {
        hideLoading();
        if (elements.connectionResult) {
            elements.connectionResult.style.display = 'block';
            elements.connectionResult.className = 'connection-result error';
            elements.connectionResult.textContent = 'Error de conexión';
        }
        showToast('Error al probar conexión', 'error');
        console.error('Error:', error);
    }
}

// Vista previa de productos
async function previewProducts() {
    try {
        showLoading('Cargando productos...');
        
        const response = await fetch('/api/products');
        const result = await response.json();
        
        hideLoading();
        
        if (elements.productsPreview) {
            elements.productsPreview.style.display = 'block';
            
            if (result.products && result.products.length > 0) {
                elements.productsPreview.className = 'products-preview success';
                
                const published = result.products.filter(p => p.publicado).length;
                const pending = result.products.length - published;
                
                elements.productsPreview.innerHTML = `
                    <strong>Productos encontrados: ${result.total}</strong><br>
                    Publicados: ${published}<br>
                    Pendientes: ${pending}<br><br>
                    <strong>Primeros 5 productos:</strong><br>
                    ${result.products.slice(0, 5).map(p => 
                        `• ${p.nombre} - ${p.precio} (${p.publicado ? 'Publicado' : 'Pendiente'})`
                    ).join('<br>')}
                `;
                showToast(`${result.total} productos encontrados`, 'success');
            } else {
                elements.productsPreview.className = 'products-preview error';
                elements.productsPreview.textContent = 'No se encontraron productos en la hoja';
                showToast('No se encontraron productos', 'warning');
            }
        }
        
    } catch (error) {
        hideLoading();
        if (elements.productsPreview) {
            elements.productsPreview.style.display = 'block';
            elements.productsPreview.className = 'products-preview error';
            elements.productsPreview.textContent = 'Error al cargar productos';
        }
        showToast('Error al cargar productos', 'error');
        console.error('Error:', error);
    }
}

// Agregar cuenta
async function addAccount(event) {
    event.preventDefault();
    
    try {
        showLoading('Subiendo archivo de cookies...');
        
        const formData = new FormData(elements.addAccountForm);
        
        const response = await fetch('/api/upload-cookies', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            showToast('Cuenta agregada correctamente', 'success');
            addActivity(`Nueva cuenta agregada: ${formData.get('accountName')}`, 'success');
            elements.addAccountForm.reset();
            loadAccounts();
        } else {
            showToast(result.error || 'Error al agregar cuenta', 'error');
        }
        
    } catch (error) {
        hideLoading();
        showToast('Error al agregar cuenta', 'error');
        console.error('Error:', error);
    }
}

// Cargar cuentas
async function loadAccounts() {
    try {
        const response = await fetch('/api/accounts');
        const result = await response.json();
        
        if (elements.accountsList && result.accounts) {
            if (result.accounts.length === 0) {
                elements.accountsList.innerHTML = `
                    <div class="no-accounts">
                        <i class="fas fa-user-plus" style="font-size: 3em; color: #718096; margin-bottom: 20px;"></i>
                        <p>No hay cuentas configuradas</p>
                        <p style="color: #718096;">Agrega tu primera cuenta usando el formulario de arriba</p>
                    </div>
                `;
            } else {
                elements.accountsList.innerHTML = result.accounts.map(account => `
                    <div class="account-card">
                        <div class="account-header">
                            <div class="account-name">${account.name}</div>
                            <div class="account-status ${account.status}">${account.status}</div>
                        </div>
                        <div class="account-stats">
                            <div class="account-stat">
                                <div class="value">${account.publicationsToday || 0}</div>
                                <div class="label">Hoy</div>
                            </div>
                            <div class="account-stat">
                                <div class="value">${account.lastUsed ? 'Usada' : 'Nueva'}</div>
                                <div class="label">Estado</div>
                            </div>
                        </div>
                        <div class="account-actions">
                            <button class="btn btn-danger btn-small" onclick="deleteAccount('${account.name}')">
                                <i class="fas fa-trash"></i>
                                Eliminar
                            </button>
                        </div>
                    </div>
                `).join('');
            }
        }
        
    } catch (error) {
        console.error('Error al cargar cuentas:', error);
        if (elements.accountsList) {
            elements.accountsList.innerHTML = `
                <div class="error-message">
                    Error al cargar cuentas
                </div>
            `;
        }
    }
}

// Eliminar cuenta
async function deleteAccount(accountName) {
    if (!confirm(`¿Estás seguro de que quieres eliminar la cuenta "${accountName}"?`)) {
        return;
    }
    
    try {
        showLoading('Eliminando cuenta...');
        
        const response = await fetch(`/api/accounts/${encodeURIComponent(accountName)}`, {
            method: 'DELETE'
        });
        
        const result = await response.json();
        hideLoading();
        
        if (result.success) {
            showToast('Cuenta eliminada correctamente', 'success');
            addActivity(`Cuenta eliminada: ${accountName}`, 'warning');
            loadAccounts();
        } else {
            showToast(result.error || 'Error al eliminar cuenta', 'error');
        }
        
    } catch (error) {
        hideLoading();
        showToast('Error al eliminar cuenta', 'error');
        console.error('Error:', error);
    }
}

// Actualizar logs
async function refreshLogs() {
    try {
        const response = await fetch('/api/logs');
        const result = await response.json();
        
        if (elements.logsContent && result.logs) {
            elements.logsContent.innerHTML = result.logs.map(log => `
                <div class="log-entry">
                    <span class="log-time">${log.timestamp}</span>
                    <span class="log-level ${log.level}">${log.level}</span>
                    <span class="log-message">${log.message}</span>
                </div>
            `).join('');
            
            // Aplicar filtro actual
            filterLogs();
        }
        
    } catch (error) {
        console.error('Error al cargar logs:', error);
        showToast('Error al cargar logs', 'error');
    }
}

// Filtrar logs
function filterLogs() {
    if (!elements.logsFilter || !elements.logsContent) return;
    
    const filterValue = elements.logsFilter.value;
    const logEntries = elements.logsContent.querySelectorAll('.log-entry');
    
    logEntries.forEach(entry => {
        const level = entry.querySelector('.log-level').textContent;
        
        if (filterValue === 'all' || level.toLowerCase() === filterValue.toLowerCase()) {
            entry.style.display = 'grid';
        } else {
            entry.style.display = 'none';
        }
    });
}

// Descargar reporte
async function downloadReport() {
    try {
        showLoading('Generando reporte...');
        
        const response = await fetch('/api/download-report');
        
        if (response.ok) {
            // Crear enlace de descarga
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `reporte-${new Date().toISOString().split('T')[0]}.csv`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);
            
            showToast('Reporte descargado correctamente', 'success');
        } else {
            const result = await response.json();
            showToast(result.error || 'No hay reporte disponible', 'warning');
        }
        
        hideLoading();
        
    } catch (error) {
        hideLoading();
        showToast('Error al descargar reporte', 'error');
        console.error('Error:', error);
    }
}

// Actualizar estado de conexión
function updateConnectionStatus(isConnected) {
    appState.isConnected = isConnected;
    
    if (elements.connectionStatus) {
        const icon = elements.connectionStatus.querySelector('i');
        const text = elements.connectionStatus.querySelector('span');
        
        if (isConnected) {
            elements.connectionStatus.className = 'status-indicator connected';
            text.textContent = 'Conectado';
        } else {
            elements.connectionStatus.className = 'status-indicator disconnected';
            text.textContent = 'Desconectado';
        }
    }
}

// Agregar actividad
function addActivity(message, type = 'info') {
    if (!elements.activityList) return;
    
    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    const activityItem = document.createElement('div');
    activityItem.className = 'activity-item';
    activityItem.innerHTML = `
        <i class="${iconMap[type] || iconMap.info}"></i>
        <span>${message}</span>
        <small class="timestamp">Hace unos momentos</small>
    `;
    
    // Agregar al principio
    elements.activityList.insertBefore(activityItem, elements.activityList.firstChild);
    
    // Mantener solo los últimos 10
    const items = elements.activityList.querySelectorAll('.activity-item');
    if (items.length > 10) {
        items[items.length - 1].remove();
    }
}

// Mostrar modal de carga
function showLoading(message = 'Procesando...') {
    if (elements.loadingModal && elements.loadingMessage) {
        elements.loadingMessage.textContent = message;
        elements.loadingModal.classList.add('show');
    }
}

// Ocultar modal de carga
function hideLoading() {
    if (elements.loadingModal) {
        elements.loadingModal.classList.remove('show');
    }
}

// Mostrar toast
function showToast(message, type = 'info') {
    if (!elements.toastContainer) return;
    
    const iconMap = {
        success: 'fas fa-check-circle',
        error: 'fas fa-exclamation-circle',
        warning: 'fas fa-exclamation-triangle',
        info: 'fas fa-info-circle'
    };
    
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `
        <i class="${iconMap[type] || iconMap.info}"></i>
        <span>${message}</span>
    `;
    
    elements.toastContainer.appendChild(toast);
    
    // Auto-remove después de 5 segundos
    setTimeout(() => {
        toast.remove();
    }, 5000);
}

// ===== EXCEL FUNCTIONALITY =====

// Switch between data sources
function switchDataSource(event) {
    const dataSource = event.target.value;
    
    // Toggle sections visibility
    if (dataSource === 'excel') {
        elements.googleSheetsSection.style.display = 'none';
        elements.excelSection.style.display = 'block';
        loadExcelInfo();
    } else {
        elements.googleSheetsSection.style.display = 'block';
        elements.excelSection.style.display = 'none';
    }
    
    // Update server data source
    updateServerDataSource(dataSource);
}

// Update data source on server
async function updateServerDataSource(dataSource) {
    try {
        const response = await fetch('/api/data-source', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ dataSource })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(`Fuente de datos cambiada a ${dataSource === 'excel' ? 'Excel' : 'Google Sheets'}`, 'success');
            await loadAppStatus(); // Refresh app status
        } else {
            throw new Error(result.error || 'Error al cambiar fuente de datos');
        }
    } catch (error) {
        console.error('Error updating data source:', error);
        showToast('Error al cambiar fuente de datos: ' + error.message, 'error');
    }
}

// Setup drag and drop for Excel upload
function setupExcelDragAndDrop() {
    const uploadArea = elements.excelUploadArea;
    
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, preventDefaults, false);
    });
    
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadArea.addEventListener(eventName, highlight, false);
    });
    
    ['dragleave', 'drop'].forEach(eventName => {
        uploadArea.addEventListener(eventName, unhighlight, false);
    });
    
    uploadArea.addEventListener('drop', handleExcelDrop, false);
    uploadArea.addEventListener('click', () => elements.excelFileInput.click());
    
    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }
    
    function highlight() {
        uploadArea.classList.add('dragover');
    }
    
    function unhighlight() {
        uploadArea.classList.remove('dragover');
    }
}

// Handle Excel file drop
function handleExcelDrop(e) {
    const files = e.dataTransfer.files;
    if (files.length > 0) {
        handleExcelFile(files[0]);
    }
}

// Handle Excel file selection
function handleExcelFileSelect(e) {
    const files = e.target.files;
    if (files.length > 0) {
        handleExcelFile(files[0]);
    }
}

// Process Excel file
async function handleExcelFile(file) {
    // Validate file type
    if (!file.name.match(/\.(xlsx|xls)$/)) {
        showToast('Por favor selecciona un archivo Excel válido (.xlsx o .xls)', 'error');
        return;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
        showToast('El archivo es demasiado grande. Máximo 10MB permitido.', 'error');
        return;
    }
    
    showLoading('Procesando archivo Excel...');
    
    try {
        const formData = new FormData();
        formData.append('excelFile', file);
        
        const response = await fetch('/api/upload-excel', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast(`Excel procesado exitosamente: ${result.stats.validProducts} productos encontrados`, 'success');
            displayExcelInfo(result.fileInfo, result.stats);
            elements.excelInfoCard.style.display = 'block';
            
            // Switch to Excel data source
            document.querySelector('input[name="dataSource"][value="excel"]').checked = true;
            switchDataSource({ target: { value: 'excel' } });
            
            // Refresh products preview if it's visible
            if (elements.productsPreview.innerHTML.trim() !== '') {
                previewProducts();
            }
            
            addActivity(`Archivo Excel cargado: ${file.name}`, 'success');
        } else {
            throw new Error(result.error || 'Error al procesar archivo Excel');
        }
    } catch (error) {
        console.error('Error processing Excel file:', error);
        showToast('Error al procesar archivo Excel: ' + error.message, 'error');
        addActivity(`Error al cargar Excel: ${file.name}`, 'error');
    } finally {
        hideLoading();
        // Clear file input
        elements.excelFileInput.value = '';
    }
}

// Display Excel file information
function displayExcelInfo(fileInfo, stats) {
    if (!fileInfo || !elements.excelInfo) return;
    
    const formatDate = (date) => new Date(date).toLocaleString('es-ES');
    const formatSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };
    
    elements.excelInfo.innerHTML = `
        <div class="excel-info-item">
            <strong>Archivo:</strong>
            <span>${fileInfo.originalName}</span>
        </div>
        <div class="excel-info-item">
            <strong>Procesado:</strong>
            <span>${formatDate(fileInfo.processedAt)}</span>
        </div>
        <div class="excel-info-item">
            <strong>Total Filas:</strong>
            <span>${fileInfo.totalRows}</span>
        </div>
        <div class="excel-info-item">
            <strong>Productos Válidos:</strong>
            <span class="excel-status success">
                <i class="fas fa-check-circle"></i>
                ${fileInfo.validProducts}
            </span>
        </div>
        <div class="excel-info-item">
            <strong>Columnas Detectadas:</strong>
            <span>${fileInfo.headers.length}</span>
        </div>
        <div class="excel-info-item">
            <strong>Estado:</strong>
            <span class="excel-status success">
                <i class="fas fa-check-circle"></i>
                Activo
            </span>
        </div>
    `;
}

// Load Excel information on page load
async function loadExcelInfo() {
    try {
        const response = await fetch('/api/excel-info');
        const result = await response.json();
        
        if (result.fileInfo) {
            displayExcelInfo(result.fileInfo, result.stats);
            elements.excelInfoCard.style.display = 'block';
        } else {
            elements.excelInfoCard.style.display = 'none';
        }
    } catch (error) {
        console.error('Error loading Excel info:', error);
        elements.excelInfoCard.style.display = 'none';
    }
}

// Validate Excel file structure
async function validateExcelFile() {
    const fileInput = elements.excelFileInput;
    
    if (!fileInput.files.length) {
        showToast('Por favor selecciona un archivo Excel para validar', 'warning');
        return;
    }
    
    showLoading('Validando estructura del Excel...');
    
    try {
        const formData = new FormData();
        formData.append('excelFile', fileInput.files[0]);
        
        const response = await fetch('/api/validate-excel', {
            method: 'POST',
            body: formData
        });
        
        const result = await response.json();
        
        if (result.validation) {
            displayValidationResult(result.validation, result.headers, result.totalRows);
        } else {
            throw new Error('Error en la validación');
        }
    } catch (error) {
        console.error('Error validating Excel:', error);
        showToast('Error al validar Excel: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Display validation results
function displayValidationResult(validation, headers, totalRows) {
    let message = `<h4>Resultado de Validación</h4>`;
    message += `<p><strong>Total de filas:</strong> ${totalRows}</p>`;
    message += `<p><strong>Columnas encontradas:</strong> ${headers.join(', ')}</p>`;
    
    if (validation.valid) {
        message += `<div class="excel-status success">
            <i class="fas fa-check-circle"></i>
            Estructura válida
        </div>`;
    } else {
        message += `<div class="excel-status error">
            <i class="fas fa-exclamation-circle"></i>
            Estructura inválida
        </div>`;
    }
    
    if (validation.errors.length > 0) {
        message += `<h5>Errores:</h5><ul>`;
        validation.errors.forEach(error => {
            message += `<li class="text-danger">${error}</li>`;
        });
        message += `</ul>`;
    }
    
    if (validation.warnings.length > 0) {
        message += `<h5>Advertencias:</h5><ul>`;
        validation.warnings.forEach(warning => {
            message += `<li class="text-warning">${warning}</li>`;
        });
        message += `</ul>`;
    }
    
    // Show in modal or dedicated area
    showToast(validation.valid ? 'Estructura válida' : 'Estructura inválida - revisa los errores', 
              validation.valid ? 'success' : 'error');
    
    // You can also display detailed results in a modal if needed
    console.log('Validation details:', message);
}

// Clear Excel data
async function clearExcelData() {
    if (!confirm('¿Estás seguro de que quieres limpiar los datos de Excel? Esta acción no se puede deshacer.')) {
        return;
    }
    
    showLoading('Limpiando datos de Excel...');
    
    try {
        const response = await fetch('/api/excel-data', {
            method: 'DELETE'
        });
        
        const result = await response.json();
        
        if (result.success) {
            showToast('Datos de Excel limpiados correctamente', 'success');
            elements.excelInfoCard.style.display = 'none';
            elements.excelFileInput.value = '';
            
            // Switch back to Google Sheets
            document.querySelector('input[name="dataSource"][value="googleSheets"]').checked = true;
            switchDataSource({ target: { value: 'googleSheets' } });
            
            addActivity('Datos de Excel limpiados', 'info');
        } else {
            throw new Error(result.error || 'Error al limpiar datos');
        }
    } catch (error) {
        console.error('Error clearing Excel data:', error);
        showToast('Error al limpiar datos de Excel: ' + error.message, 'error');
    } finally {
        hideLoading();
    }
}

// Update the initialization to load current data source
async function loadCurrentDataSource() {
    try {
        const response = await fetch('/api/status');
        const status = await response.json();
        
        if (status.dataSource) {
            // Set the correct radio button
            const radio = document.querySelector(`input[name="dataSource"][value="${status.dataSource}"]`);
            if (radio) {
                radio.checked = true;
                switchDataSource({ target: { value: status.dataSource } });
            }
        }
    } catch (error) {
        console.error('Error loading current data source:', error);
    }
}

// Hacer funciones globales para uso en HTML
window.deleteAccount = deleteAccount;

// Initialize data source on page load
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(loadCurrentDataSource, 1000); // Load after initial setup
});