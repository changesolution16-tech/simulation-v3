import React, { useState } from 'react';
import { Copy, CheckCircle, Download, Settings } from 'lucide-react';
import { LTIService } from '../../lib/lti';

const LTIConfig: React.FC = () => {
  const [copied, setCopied] = useState(false);
  const baseUrl = window.location.origin;

  const configJSON = LTIService.generateLTIConfigJSON(baseUrl);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([JSON.stringify(configJSON, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'lti-config.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
          <div className="flex items-center">
            <Settings className="w-8 h-8 mr-3" />
            <div>
              <h1 className="text-2xl font-bold">LTI 1.3 Configuration</h1>
              <p className="text-blue-100 mt-1">
                Configure this simulation as an External Tool in Moodle
              </p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 mb-2">Quick Setup Guide</h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800 text-sm">
              <li>In Moodle, go to Site administration → Plugins → Activity modules → External tool → Manage tools</li>
              <li>Click "Configure a tool manually"</li>
              <li>Copy the values below into the corresponding fields</li>
              <li>Click "Save changes"</li>
              <li>Add the External Tool activity to any course</li>
            </ol>
          </div>

          <div className="space-y-4">
            <ConfigField
              label="Tool Name"
              value="Soft Skills Leadership Simulation"
              onCopy={handleCopy}
              copied={copied}
            />

            <ConfigField
              label="Tool URL / Target Link URI"
              value={`${baseUrl}/lti/launch`}
              onCopy={handleCopy}
              copied={copied}
            />

            <ConfigField
              label="LTI Version"
              value="LTI 1.3"
              onCopy={handleCopy}
              copied={copied}
            />

            <ConfigField
              label="Public Key Type"
              value="Keyset URL"
              onCopy={handleCopy}
              copied={copied}
            />

            <ConfigField
              label="Public Keyset URL"
              value={`${baseUrl}/lti/jwks`}
              onCopy={handleCopy}
              copied={copied}
            />

            <ConfigField
              label="Initiate Login URL"
              value={`${baseUrl}/lti/login`}
              onCopy={handleCopy}
              copied={copied}
            />

            <ConfigField
              label="Redirection URI(s)"
              value={`${baseUrl}/lti/launch`}
              onCopy={handleCopy}
              copied={copied}
            />

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Services</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">IMS LTI Assignment and Grade Services:</span>
                    <span className="text-gray-600 ml-1">Use this service for grade sync</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">IMS LTI Names and Role Provisioning:</span>
                    <span className="text-gray-600 ml-1">Use this service to sync student info</span>
                  </div>
                </div>
                <div className="flex items-start">
                  <CheckCircle className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium">Deep Linking:</span>
                    <span className="text-gray-600 ml-1">Enable for content selection</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h3 className="font-semibold text-gray-900 mb-3">Privacy Settings</h3>
              <div className="space-y-2 text-sm">
                <label className="flex items-center">
                  <input type="checkbox" checked disabled className="mr-2" />
                  <span>Share launcher's name with tool</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" checked disabled className="mr-2" />
                  <span>Share launcher's email with tool</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" checked disabled className="mr-2" />
                  <span>Accept grades from the tool</span>
                </label>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <button
              onClick={handleDownload}
              className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition-colors font-medium flex items-center justify-center"
            >
              <Download className="w-5 h-5 mr-2" />
              Download Full Configuration JSON
            </button>
          </div>

          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <h3 className="font-semibold text-gray-900 mb-2 text-sm">Advanced: Full JSON Configuration</h3>
            <pre className="bg-gray-900 text-gray-100 p-4 rounded text-xs overflow-x-auto">
              {JSON.stringify(configJSON, null, 2)}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

interface ConfigFieldProps {
  label: string;
  value: string;
  onCopy: (text: string) => void;
  copied: boolean;
}

const ConfigField: React.FC<ConfigFieldProps> = ({ label, value, onCopy, copied }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          readOnly
          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-gray-900 text-sm"
        />
        <button
          onClick={() => onCopy(value)}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-300 rounded-lg transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <Copy className="w-5 h-5 text-gray-600" />
          )}
        </button>
      </div>
    </div>
  );
};

export default LTIConfig;
