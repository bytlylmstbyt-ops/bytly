import { useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    ChevronRight, ChevronDown, Folder, FolderOpen,
    Download, Loader2, RefreshCw, CheckCircle2, AlertCircle, Link2
} from 'lucide-react';
import AutodeskConnectButton from './AutodeskConnectButton';

const FILE_ICONS = { rvt: '🏗️', dwg: '📐', ifc: '🧱', nwc: '🔷', pdf: '📄' };

function getExt(name = '') { return name.split('.').pop().toLowerCase(); }

export default function BIM360Browser({ onImported }) {
    const [connectionStatus, setConnectionStatus] = useState('loading'); // loading | connected | disconnected
    const [hubs, setHubs] = useState([]);
    const [selectedHub, setSelectedHub] = useState(null);
    const [projects, setProjects] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [folderTree, setFolderTree] = useState([]);
    const [openFolders, setOpenFolders] = useState({});
    const [folderContents, setFolderContents] = useState({});
    const [importing, setImporting] = useState({});
    const [importedIds, setImportedIds] = useState(new Set());
    const [loadingHubs, setLoadingHubs] = useState(false);
    const [loadingProjects, setLoadingProjects] = useState(false);
    const [error, setError] = useState('');
    const [syncing, setSyncing] = useState(false);
    const [syncResult, setSyncResult] = useState(null);

    const handleConnectionChange = (status) => {
        setConnectionStatus(status);
        if (status === 'connected') {
            loadHubs();
        }
    };

    const call = async (payload) => {
        const res = await base44.functions.invoke('bimService', payload);
        return res.data;
    };

    const loadHubs = async () => {
        setLoadingHubs(true);
        setError('');
        try {
            const data = await call({ action: 'list_hubs' });
            if (data.error === 'not_connected') {
                setConnectionStatus('disconnected');
                return;
            }
            setHubs(data.hubs || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoadingHubs(false);
        }
    };

    const selectHub = async (hub) => {
        setSelectedHub(hub);
        setSelectedProject(null);
        setFolderTree([]);
        setLoadingProjects(true);
        try {
            const data = await call({ action: 'list_projects', hub_id: hub.id });
            setProjects(data.projects || []);
        } catch (e) {
            setError(e.message);
        } finally {
            setLoadingProjects(false);
        }
    };

    const selectProject = async (project) => {
        setSelectedProject(project);
        setFolderTree([]);
        setFolderContents({});
        setOpenFolders({});
        try {
            const data = await call({
                action: 'list_top_folders',
                hub_id: selectedHub.id,
                project_id: project.id
            });
            setFolderTree(data.folders || []);
        } catch (e) {
            setError(e.message);
        }
    };

    const toggleFolder = async (folder) => {
        const fid = folder.id;
        const isOpen = openFolders[fid];

        setOpenFolders(prev => ({ ...prev, [fid]: !isOpen }));

        if (!isOpen && !folderContents[fid]) {
            try {
                const data = await call({
                    action: 'list_folder_contents',
                    project_id: selectedProject.id,
                    folder_id: fid
                });
                setFolderContents(prev => ({ ...prev, [fid]: data.items || [] }));
            } catch (e) {
                setError(e.message);
            }
        }
    };

    const importItem = async (item, folderId) => {
        setImporting(prev => ({ ...prev, [item.id]: true }));
        try {
            await call({
                action: 'import_item',
                hub_id: selectedHub.id,
                project_id: selectedProject.id,
                folder_id: folderId,
                item_id: item.id
            });
            setImportedIds(prev => new Set([...prev, item.id]));
            onImported?.();
        } catch (e) {
            setError(e.message);
        } finally {
            setImporting(prev => ({ ...prev, [item.id]: false }));
        }
    };

    const syncAll = async () => {
        setSyncing(true);
        setSyncResult(null);
        try {
            const data = await call({ action: 'sync_all' });
            setSyncResult(data);
        } catch (e) {
            setError(e.message);
        } finally {
            setSyncing(false);
        }
    };

    const supportedExts = ['rvt', 'dwg', 'ifc', 'nwc', 'nwd'];

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden" dir="rtl">
            {/* Header */}
            <div className="bg-gradient-to-l from-blue-800 to-blue-600 text-white px-5 py-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <span className="text-xl">🏗️</span>
                    <div>
                        <h3 className="font-bold">Autodesk Construction Cloud</h3>
                        <p className="text-blue-200 text-xs">استعراض ورفع النماذج من BIM 360</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <AutodeskConnectButton onStatusChange={handleConnectionChange} />
                    {connectionStatus === 'connected' && (
                        <Button
                            size="sm"
                            variant="outline"
                            className="border-white/30 text-white hover:bg-white/20 gap-2"
                            onClick={syncAll}
                            disabled={syncing}
                        >
                            <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
                            مزامنة الكل
                        </Button>
                    )}
                </div>
            </div>

            {/* Sync Result */}
            {syncResult && (
                <div className="bg-green-50 border-b border-green-200 px-5 py-2 flex items-center gap-2 text-sm text-green-700">
                    <CheckCircle2 className="w-4 h-4" />
                    تمت المزامنة: {syncResult.synced} نموذج، محدّث: {syncResult.updated_count}
                </div>
            )}

            {/* Error */}
            {error && (
                <div className="bg-red-50 border-b border-red-200 px-5 py-2 flex items-center gap-2 text-sm text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                    <button className="mr-auto text-xs underline" onClick={() => setError('')}>إغلاق</button>
                </div>
            )}

            <div className="flex" style={{ minHeight: 340 }}>
                {/* Hubs Column */}
                <div className="w-48 border-l border-gray-100 bg-gray-50 p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2 px-1">الحسابات</p>
                    {loadingHubs ? (
                        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
                    ) : hubs.length === 0 ? (
                        <p className="text-xs text-gray-400 px-1">لا توجد حسابات</p>
                    ) : (
                        hubs.map(hub => (
                            <button
                                key={hub.id}
                                onClick={() => selectHub(hub)}
                                className={`w-full text-right text-sm px-2 py-2 rounded-lg mb-1 transition-colors ${selectedHub?.id === hub.id ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-200 text-gray-700'}`}
                            >
                                🏢 {hub.attributes?.name || hub.id}
                            </button>
                        ))
                    )}
                </div>

                {/* Projects Column */}
                <div className="w-52 border-l border-gray-100 bg-white p-3">
                    <p className="text-xs font-semibold text-gray-500 mb-2 px-1">المشاريع</p>
                    {loadingProjects ? (
                        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
                    ) : !selectedHub ? (
                        <p className="text-xs text-gray-400 px-1">اختر حساباً</p>
                    ) : projects.length === 0 ? (
                        <p className="text-xs text-gray-400 px-1">لا توجد مشاريع</p>
                    ) : (
                        projects.map(proj => (
                            <button
                                key={proj.id}
                                onClick={() => selectProject(proj)}
                                className={`w-full text-right text-sm px-2 py-2 rounded-lg mb-1 transition-colors ${selectedProject?.id === proj.id ? 'bg-blue-100 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}`}
                            >
                                📁 {proj.attributes?.name || proj.id}
                            </button>
                        ))
                    )}
                </div>

                {/* Folder Tree + Files */}
                <div className="flex-1 p-3 overflow-y-auto">
                    <p className="text-xs font-semibold text-gray-500 mb-2 px-1">المجلدات والملفات</p>
                    {!selectedProject ? (
                        <p className="text-xs text-gray-400 px-1">اختر مشروعاً</p>
                    ) : folderTree.length === 0 ? (
                        <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-blue-500" /></div>
                    ) : (
                        folderTree.map(folder => (
                            <FolderNode
                                key={folder.id}
                                folder={folder}
                                isOpen={!!openFolders[folder.id]}
                                contents={folderContents[folder.id]}
                                onToggle={() => toggleFolder(folder)}
                                onImport={(item) => importItem(item, folder.id)}
                                importing={importing}
                                importedIds={importedIds}
                                supportedExts={supportedExts}
                            />
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}

function FolderNode({ folder, isOpen, contents, onToggle, onImport, importing, importedIds, supportedExts }) {
    const name = folder.attributes?.displayName || folder.attributes?.name || folder.id;
    return (
        <div className="mb-1">
            <button
                onClick={onToggle}
                className="flex items-center gap-2 w-full text-right text-sm px-2 py-1.5 rounded-lg hover:bg-gray-100 text-gray-800"
            >
                {isOpen ? <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />}
                {isOpen ? <FolderOpen className="w-4 h-4 text-yellow-500 shrink-0" /> : <Folder className="w-4 h-4 text-yellow-500 shrink-0" />}
                <span className="truncate">{name}</span>
            </button>

            {isOpen && (
                <div className="mr-6 border-r border-gray-100 pr-2 mt-1">
                    {!contents ? (
                        <div className="flex items-center gap-2 px-2 py-1 text-xs text-gray-400">
                            <Loader2 className="w-3 h-3 animate-spin" /> جارٍ التحميل...
                        </div>
                    ) : contents.length === 0 ? (
                        <p className="text-xs text-gray-400 px-2 py-1">المجلد فارغ</p>
                    ) : (
                        contents.map(item => {
                            if (item.type === 'folders') {
                                return (
                                    <FolderNode
                                        key={item.id}
                                        folder={{ id: item.id, attributes: { displayName: item.name } }}
                                        isOpen={false}
                                        contents={null}
                                        onToggle={() => {}}
                                        onImport={onImport}
                                        importing={importing}
                                        importedIds={importedIds}
                                        supportedExts={supportedExts}
                                    />
                                );
                            }
                            const ext = getExt(item.name);
                            const isSupported = supportedExts.includes(ext);
                            const isImported = importedIds.has(item.id);
                            const isImporting = importing[item.id];
                            return (
                                <div
                                    key={item.id}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-gray-50 group"
                                >
                                    <span className="text-base shrink-0">{FILE_ICONS[ext] || '📄'}</span>
                                    <span className="flex-1 text-sm text-gray-700 truncate">{item.name}</span>
                                    {item.last_modified && (
                                        <span className="text-xs text-gray-400 hidden group-hover:block shrink-0">
                                            {new Date(item.last_modified).toLocaleDateString('ar')}
                                        </span>
                                    )}
                                    {isSupported && (
                                        isImported ? (
                                            <Badge className="bg-green-100 text-green-700 border-green-200 text-xs shrink-0">
                                                <CheckCircle2 className="w-3 h-3 ml-1" /> مستورد
                                            </Badge>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-7 text-xs shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                                onClick={() => onImport(item)}
                                                disabled={isImporting}
                                            >
                                                {isImporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <><Download className="w-3 h-3 ml-1" />استيراد</>}
                                            </Button>
                                        )
                                    )}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}