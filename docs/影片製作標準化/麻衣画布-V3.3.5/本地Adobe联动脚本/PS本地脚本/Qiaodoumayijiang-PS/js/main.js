/**
 * Qiaodoumayijiang PS - 主逻辑
 * 版本 1.0.0 - Photoshop 图片素材导入工具
 */

(function() {
    'use strict';

    // ==================== 配置 ====================
    const CONFIG = {
        assetsDir: '',
        manifestFile: 'manifest.json',
        supportedImages: ['.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.tiff', '.tif', '.psd'],
        autoRefreshInterval: 2000
    };

    // CEP 接口
    const csInterface = new CSInterface();
    
    // Node.js 模块
    const fs = require('fs');
    const path = require('path');
    const os = require('os');

    // 状态
    let currentAssets = [];
    let filteredAssets = [];
    let selectedAssets = new Set();
    let lastClickedIndex = -1;
    let lastFileCount = 0;
    let autoRefreshTimer = null;

    // DOM 元素
    let elements = {};

    // ==================== 初始化 ====================

    function init() {
        const homeDir = os.homedir();
        CONFIG.assetsDir = path.join(homeDir, 'Qiaodoumayijiang');

        elements = {
            assetsDir: document.getElementById('assetsDir'),
            browseDirBtn: document.getElementById('browseDirBtn'),
            scanFolderBtn: document.getElementById('scanFolderBtn'),
            assetsGrid: document.getElementById('assetsGrid'),
            selectionCount: document.getElementById('selectionCount'),
            deleteBtn: document.getElementById('deleteBtn'),
            openNewBtn: document.getElementById('openNewBtn'),
            placeLayerBtn: document.getElementById('placeLayerBtn'),
            statusText: document.getElementById('statusText'),
            autoRefreshIndicator: document.getElementById('autoRefreshIndicator')
        };

        elements.assetsDir.value = CONFIG.assetsDir;

        // 绑定事件
        elements.scanFolderBtn.addEventListener('click', scanFolder);
        elements.browseDirBtn.addEventListener('click', browseDir);
        elements.deleteBtn.addEventListener('click', deleteSelectedAssets);
        elements.openNewBtn.addEventListener('click', () => importToPS('open'));
        elements.placeLayerBtn.addEventListener('click', () => importToPS('place'));

        loadSettings();
        loadAssets();
        startAutoRefresh();
    }

    // ==================== 自动刷新 ====================

    function startAutoRefresh() {
        stopAutoRefresh();
        autoRefreshTimer = setInterval(checkForNewFiles, CONFIG.autoRefreshInterval);
    }

    function stopAutoRefresh() {
        if (autoRefreshTimer) {
            clearInterval(autoRefreshTimer);
            autoRefreshTimer = null;
        }
    }

    function checkForNewFiles() {
        try {
            let currentCount = 0;
            const subdirs = ['images', ''];
            
            subdirs.forEach(subdir => {
                const dirPath = subdir ? path.join(CONFIG.assetsDir, subdir) : CONFIG.assetsDir;
                if (fs.existsSync(dirPath)) {
                    try {
                        const files = fs.readdirSync(dirPath);
                        files.forEach(filename => {
                            const ext = path.extname(filename).toLowerCase();
                            if (CONFIG.supportedImages.includes(ext)) {
                                currentCount++;
                            }
                        });
                    } catch(e) {}
                }
            });

            if (lastFileCount !== 0 && currentCount !== lastFileCount) {
                setStatus('检测到新图片，正在刷新...');
                if (elements.autoRefreshIndicator) {
                    elements.autoRefreshIndicator.style.color = '#FFD700';
                    setTimeout(() => {
                        elements.autoRefreshIndicator.style.color = '#4CAF50';
                    }, 500);
                }
                scanFolderInternal();
                renderAssets();
                setStatus(`共 ${currentAssets.length} 张图片 (自动监听中)`);
            }
            
            lastFileCount = currentCount;
        } catch(e) {
            console.log('检测文件变化失败:', e);
        }
    }

    // ==================== 设置管理 ====================

    function loadSettings() {
        try {
            const settingsPath = path.join(os.homedir(), 'Qiaodoumayijiang_settings.json');
            if (fs.existsSync(settingsPath)) {
                const settings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
                if (settings.assetsDir && fs.existsSync(settings.assetsDir)) {
                    CONFIG.assetsDir = settings.assetsDir;
                    elements.assetsDir.value = CONFIG.assetsDir;
                }
            }
        } catch(e) {}
    }

    function saveSettings() {
        try {
            const settingsPath = path.join(os.homedir(), 'Qiaodoumayijiang_settings.json');
            fs.writeFileSync(settingsPath, JSON.stringify({ assetsDir: CONFIG.assetsDir }), 'utf8');
        } catch(e) {}
    }

    // ==================== 目录选择 ====================

    function browseDir() {
        const result = window.cep.fs.showOpenDialogEx(false, true, '选择素材目录', CONFIG.assetsDir, null);
        if (result.data && result.data.length > 0) {
            CONFIG.assetsDir = result.data[0];
            elements.assetsDir.value = CONFIG.assetsDir;
            saveSettings();
            lastFileCount = 0;
            loadAssets();
            startAutoRefresh();
        }
    }

    // ==================== 素材加载 ====================

    function loadAssets() {
        setStatus('正在扫描...');
        currentAssets = [];
        selectedAssets.clear();
        lastClickedIndex = -1;

        scanFolderInternal();
        renderAssets();
        setStatus(`共 ${currentAssets.length} 张图片 (自动监听中)`);
    }

    function scanFolder() {
        setStatus('正在扫描文件夹...');
        scanFolderInternal();
        renderAssets();
        setStatus(`扫描完成，共 ${currentAssets.length} 张图片`);
    }

    function scanFolderInternal() {
        currentAssets = [];
        const subdirs = ['images', ''];
        
        subdirs.forEach(subdir => {
            const dirPath = subdir ? path.join(CONFIG.assetsDir, subdir) : CONFIG.assetsDir;
            if (!fs.existsSync(dirPath)) return;

            try {
                const files = fs.readdirSync(dirPath);
                files.forEach(filename => {
                    const ext = path.extname(filename).toLowerCase();
                    const fullPath = path.join(dirPath, filename);
                    
                    const stat = fs.statSync(fullPath);
                    if (!stat.isFile()) return;

                    if (CONFIG.supportedImages.includes(ext)) {
                        const relativePath = subdir ? `${subdir}/${filename}` : filename;
                        const id = path.basename(filename, ext) + '_' + stat.mtimeMs;

                        const existing = currentAssets.find(a => a.fullPath === fullPath);
                        if (!existing) {
                            currentAssets.push({
                                id: id,
                                type: 'image',
                                filename: relativePath,
                                fullPath: fullPath,
                                size: stat.size,
                                createdAt: stat.birthtime.toISOString()
                            });
                        }
                    }
                });
            } catch(e) {}
        });

        currentAssets.sort((a, b) => {
            const timeA = a.createdAt || '';
            const timeB = b.createdAt || '';
            return timeB.localeCompare(timeA);
        });
    }

    // ==================== 渲染 ====================

    function renderAssets() {
        const grid = elements.assetsGrid;
        grid.innerHTML = '';
        lastClickedIndex = -1;

        filteredAssets = currentAssets;

        if (filteredAssets.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <p>暂无图片</p>
                    <p class="hint">点击「扫描文件夹」或放入图片</p>
                </div>
            `;
            return;
        }

        filteredAssets.forEach((asset, index) => {
            const card = createAssetCard(asset, index);
            grid.appendChild(card);
        });
    }

    function getImageDataUrl(filePath) {
        try {
            const stat = fs.statSync(filePath);
            if (stat.size > 10 * 1024 * 1024) return null;
            
            const buffer = fs.readFileSync(filePath);
            const base64 = buffer.toString('base64');
            const ext = path.extname(filePath).toLowerCase();
            const mimeTypes = {
                '.png': 'image/png',
                '.jpg': 'image/jpeg',
                '.jpeg': 'image/jpeg',
                '.gif': 'image/gif',
                '.webp': 'image/webp',
                '.bmp': 'image/bmp'
            };
            const mime = mimeTypes[ext] || 'image/png';
            return `data:${mime};base64,${base64}`;
        } catch(e) {
            return null;
        }
    }

    function createAssetCard(asset, index) {
        const card = document.createElement('div');
        card.className = 'asset-card';
        if (selectedAssets.has(asset.id)) {
            card.classList.add('selected');
        }

        let displayName = asset.id.replace(/_\d+$/, '');
        const truncatedName = displayName.length > 15 ? displayName.substring(0, 15) + '...' : displayName;
        const sizeStr = formatSize(asset.size);

        card.innerHTML = `
            <div class="thumbnail-placeholder">🖼️</div>
            <div class="checkbox"></div>
            <div class="info">
                <div class="name" title="${displayName}">${truncatedName}</div>
                <div class="meta">${sizeStr}</div>
            </div>
        `;

        // 异步加载缩略图
        if (fs.existsSync(asset.fullPath)) {
            setTimeout(() => {
                const dataUrl = getImageDataUrl(asset.fullPath);
                if (dataUrl) {
                    const placeholder = card.querySelector('.thumbnail-placeholder');
                    if (placeholder) {
                        const img = document.createElement('img');
                        img.className = 'thumbnail';
                        img.src = dataUrl;
                        img.alt = asset.id;
                        placeholder.replaceWith(img);
                    }
                }
            }, 10);
        }

        // 点击事件
        card.addEventListener('click', (e) => {
            handleCardClick(asset, card, index, e);
        });

        // 双击打开
        card.addEventListener('dblclick', () => {
            clearSelection();
            selectedAssets.add(asset.id);
            importToPS('open');
        });

        card.dataset.assetId = asset.id;
        card.dataset.index = index;

        return card;
    }

    function handleCardClick(asset, card, index, e) {
        if (e.shiftKey && lastClickedIndex !== -1) {
            const start = Math.min(lastClickedIndex, index);
            const end = Math.max(lastClickedIndex, index);
            
            if (!e.ctrlKey && !e.metaKey) {
                clearSelection();
            }
            
            for (let i = start; i <= end; i++) {
                selectedAssets.add(filteredAssets[i].id);
            }
            
            document.querySelectorAll('.asset-card').forEach(c => {
                const assetId = c.dataset.assetId;
                if (selectedAssets.has(assetId)) {
                    c.classList.add('selected');
                } else {
                    c.classList.remove('selected');
                }
            });
        } else if (e.ctrlKey || e.metaKey) {
            toggleSelection(asset, card);
            lastClickedIndex = index;
        } else {
            clearSelection();
            toggleSelection(asset, card);
            lastClickedIndex = index;
        }
        
        updateSelectionCount();
    }

    function formatSize(bytes) {
        if (!bytes) return '-';
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    // ==================== 选择管理 ====================

    function toggleSelection(asset, card) {
        if (selectedAssets.has(asset.id)) {
            selectedAssets.delete(asset.id);
            card.classList.remove('selected');
        } else {
            selectedAssets.add(asset.id);
            card.classList.add('selected');
        }
        updateSelectionCount();
    }

    function clearSelection() {
        selectedAssets.clear();
        document.querySelectorAll('.asset-card.selected').forEach(card => {
            card.classList.remove('selected');
        });
        updateSelectionCount();
    }

    function updateSelectionCount() {
        elements.selectionCount.textContent = `已选择 ${selectedAssets.size} 个`;
    }

    // ==================== 删除功能 ====================

    function deleteSelectedAssets() {
        if (selectedAssets.size === 0) {
            alert('请先选择要删除的图片');
            return;
        }

        const count = selectedAssets.size;
        if (!confirm(`确定要删除选中的 ${count} 张图片吗？\n\n此操作无法撤销！`)) {
            return;
        }

        let successCount = 0;
        currentAssets.forEach(asset => {
            if (selectedAssets.has(asset.id)) {
                try {
                    if (fs.existsSync(asset.fullPath)) {
                        fs.unlinkSync(asset.fullPath);
                        successCount++;
                    }
                } catch(e) {}
            }
        });

        selectedAssets.clear();
        lastClickedIndex = -1;
        scanFolderInternal();
        renderAssets();
        setStatus(`成功删除 ${successCount} 张图片`);
    }

    // ==================== PS 导入功能 ====================

    function importToPS(mode) {
        if (selectedAssets.size === 0) {
            alert('请先选择要导入的图片');
            return;
        }

        const assetsToImport = currentAssets.filter(a => selectedAssets.has(a.id));
        setStatus('正在导入...');

        const filePaths = assetsToImport.map(a => a.fullPath.replace(/\\/g, '/'));
        
        let script = '';
        
        if (mode === 'open') {
            // 新建文档打开图片
            script = `
                (function() {
                    var filePaths = ${JSON.stringify(filePaths)};
                    var successCount = 0;
                    var failCount = 0;
                    
                    for (var i = 0; i < filePaths.length; i++) {
                        try {
                            var file = new File(filePaths[i]);
                            if (file.exists) {
                                app.open(file);
                                successCount++;
                            } else {
                                failCount++;
                            }
                        } catch(e) {
                            failCount++;
                        }
                    }
                    
                    return JSON.stringify({ success: true, imported: successCount, failed: failCount });
                })();
            `;
        } else if (mode === 'place') {
            // 作为图层导入到当前文档
            script = `
                (function() {
                    var filePaths = ${JSON.stringify(filePaths)};
                    var successCount = 0;
                    var failCount = 0;
                    
                    // 检查是否有打开的文档
                    if (app.documents.length === 0) {
                        return JSON.stringify({ success: false, error: "请先打开或新建一个文档" });
                    }
                    
                    var doc = app.activeDocument;
                    
                    for (var i = 0; i < filePaths.length; i++) {
                        try {
                            var file = new File(filePaths[i]);
                            if (file.exists) {
                                // 使用 Place 命令导入为智能对象
                                var desc = new ActionDescriptor();
                                desc.putPath(charIDToTypeID("null"), file);
                                desc.putEnumerated(charIDToTypeID("FTcs"), charIDToTypeID("QCSt"), charIDToTypeID("Qcsa"));
                                var offsetDesc = new ActionDescriptor();
                                offsetDesc.putUnitDouble(charIDToTypeID("Hrzn"), charIDToTypeID("#Pxl"), 0);
                                offsetDesc.putUnitDouble(charIDToTypeID("Vrtc"), charIDToTypeID("#Pxl"), 0);
                                desc.putObject(charIDToTypeID("Ofst"), charIDToTypeID("Ofst"), offsetDesc);
                                executeAction(charIDToTypeID("Plc "), desc, DialogModes.NO);
                                
                                // 确认置入
                                try {
                                    var confirmDesc = new ActionDescriptor();
                                    executeAction(charIDToTypeID("Plc "), confirmDesc, DialogModes.NO);
                                } catch(e) {}
                                
                                successCount++;
                            } else {
                                failCount++;
                            }
                        } catch(e) {
                            failCount++;
                        }
                    }
                    
                    return JSON.stringify({ success: true, imported: successCount, failed: failCount });
                })();
            `;
        }

        csInterface.evalScript(script, (result) => {
            try {
                const response = JSON.parse(result);
                if (response.success) {
                    const msg = response.failed > 0 
                        ? `导入完成: 成功 ${response.imported}, 失败 ${response.failed}`
                        : `成功导入 ${response.imported} 张图片`;
                    setStatus(msg);
                } else {
                    alert(response.error || '导入失败');
                    setStatus('导入失败');
                }
            } catch(e) {
                setStatus('导入完成');
            }
            clearSelection();
        });
    }

    // ==================== 状态 ====================

    function setStatus(text) {
        elements.statusText.textContent = text;
    }

    // ==================== 启动 ====================

    document.addEventListener('DOMContentLoaded', init);

    window.addEventListener('beforeunload', () => {
        stopAutoRefresh();
    });

})();
