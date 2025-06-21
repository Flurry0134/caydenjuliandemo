import React, { useState } from 'react';
import { User, AuditLogEntry, BrandingSettings } from '../../types';
import { Settings, Palette, Users, FileText, Upload, ToggleLeft, ToggleRight } from 'lucide-react';

const AdminSettings = () => {
  const [activeTab, setActiveTab] = useState<'branding' | 'users' | 'audit'>('branding');
  
  // Mock data
  const [brandingSettings, setBrandingSettings] = useState<BrandingSettings>({
    primaryColor: '#3B82F6',
    roundedCorners: true
  });

  const [users, setUsers] = useState<User[]>([
    {
      id: '1',
      email: 'cay1768@gmail.com',
      name: 'Admin User',
      role: 'admin',
      lastLogin: new Date('2024-01-15T10:30:00')
    },
    {
      id: '2',
      email: 'user@example.com',
      name: 'Test User',
      role: 'user',
      lastLogin: new Date('2024-01-14T15:45:00')
    }
  ]);

  const auditLogs: AuditLogEntry[] = [
    {
      id: '1',
      timestamp: new Date('2024-01-15T10:30:00'),
      username: 'Admin User',
      action: 'Benutzer angemeldet',
      ipAddress: '192.168.1.***'
    },
    {
      id: '2',
      timestamp: new Date('2024-01-15T09:15:00'),
      username: 'Admin User',
      action: 'Branding-Einstellungen geändert',
      ipAddress: '192.168.1.***'
    },
    {
      id: '3',
      timestamp: new Date('2024-01-14T16:20:00'),
      username: 'Test User',
      action: 'Datei hochgeladen',
      ipAddress: '10.0.0.***'
    }
  ];

  const handleColorChange = (color: string) => {
    setBrandingSettings(prev => ({ ...prev, primaryColor: color }));
    // Apply color to document root for live preview
    document.documentElement.style.setProperty('--primary-color', color);
  };

  const handleUserRoleToggle = (userId: string) => {
    setUsers(prev => prev.map(user => 
      user.id === userId 
        ? { ...user, role: user.role === 'admin' ? 'user' : 'admin' }
        : user
    ));
  };

  const tabs = [
    { id: 'branding' as const, label: 'Branding', icon: Palette },
    { id: 'users' as const, label: 'Nutzerverwaltung', icon: Users },
    { id: 'audit' as const, label: 'Audit-Log', icon: FileText }
  ];

  return (
    <div className="h-full flex flex-col">
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center space-x-3">
          <Settings className="w-6 h-6 text-gray-600 dark:text-gray-400" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Einstellungen
          </h2>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-64 bg-gray-50 dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700">
          <nav className="p-4">
            <ul className="space-y-2">
              {tabs.map((tab) => (
                <li key={tab.id}>
                  <button
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-xl text-left transition-all duration-200 ${
                      activeTab === tab.id
                        ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                    }`}
                  >
                    <tab.icon className="w-5 h-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'branding' && (
            <div className="p-6 space-y-8">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                  Branding-Einstellungen
                </h3>
                
                <div className="grid gap-6">
                  {/* Primary Color */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                      Primärfarbe
                    </h4>
                    <div className="flex items-center space-x-4">
                      <input
                        type="color"
                        value={brandingSettings.primaryColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="w-12 h-12 border border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer"
                      />
                      <input
                        type="text"
                        value={brandingSettings.primaryColor}
                        onChange={(e) => handleColorChange(e.target.value)}
                        className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
                        placeholder="#3B82F6"
                      />
                    </div>
                  </div>

                  {/* Logo Upload */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                      Logo
                    </h4>
                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                      <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Logo hochladen (empfohlen: 120x120px, PNG/SVG)
                      </p>
                      <button className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                        Datei auswählen
                      </button>
                    </div>
                  </div>

                  {/* Corner Style */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                      Ecken-Stil
                    </h4>
                    <div className="flex items-center space-x-4">
                      <button
                        onClick={() => setBrandingSettings(prev => ({ ...prev, roundedCorners: true }))}
                        className={`px-4 py-2 rounded-lg border transition-colors ${
                          brandingSettings.roundedCorners
                            ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                      >
                        Abgerundet
                      </button>
                      <button
                        onClick={() => setBrandingSettings(prev => ({ ...prev, roundedCorners: false }))}
                        className={`px-4 py-2 border transition-colors ${
                          !brandingSettings.roundedCorners
                            ? 'bg-blue-100 dark:bg-blue-900/30 border-blue-500 text-blue-700 dark:text-blue-300'
                            : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700'
                        }`}
                        style={{ borderRadius: brandingSettings.roundedCorners ? '8px' : '2px' }}
                      >
                        Eckig
                      </button>
                    </div>
                  </div>

                  {/* Live Preview */}
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-6">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-4">
                      Live-Vorschau
                    </h4>
                    <div className="space-y-4">
                      <button
                        className={`px-6 py-3 text-white font-medium transition-colors ${
                          brandingSettings.roundedCorners ? 'rounded-xl' : 'rounded-sm'
                        }`}
                        style={{ backgroundColor: brandingSettings.primaryColor }}
                      >
                        Beispiel-Button
                      </button>
                      <div
                        className={`p-4 text-white ${
                          brandingSettings.roundedCorners ? 'rounded-xl' : 'rounded-sm'
                        }`}
                        style={{ backgroundColor: brandingSettings.primaryColor }}
                      >
                        Beispiel-Karte mit Primärfarbe
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'users' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Nutzerverwaltung
              </h3>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Benutzer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Rolle
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Letzte Anmeldung
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Aktionen
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {users.map((user) => (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div>
                              <div className="text-sm font-medium text-gray-900 dark:text-white">
                                {user.name}
                              </div>
                              <div className="text-sm text-gray-500 dark:text-gray-400">
                                {user.email}
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin'
                                ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'
                                : 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
                            }`}>
                              {user.role === 'admin' ? 'Administrator' : 'Benutzer'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                            {user.lastLogin?.toLocaleString('de-DE')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <button
                              onClick={() => handleUserRoleToggle(user.id)}
                              className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors"
                            >
                              {user.role === 'admin' ? (
                                <ToggleRight className="w-5 h-5" />
                              ) : (
                                <ToggleLeft className="w-5 h-5" />
                              )}
                              <span>
                                {user.role === 'admin' ? 'Als Benutzer' : 'Als Admin'}
                              </span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
                Audit-Log
              </h3>
              
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-900">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Zeitstempel
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Benutzer
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Aktion
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          IP-Adresse
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {log.timestamp.toLocaleString('de-DE')}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">
                            {log.username}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700 dark:text-gray-300">
                            {log.action}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400 font-mono">
                            {log.ipAddress}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSettings;