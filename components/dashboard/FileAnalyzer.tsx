import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { useInventory } from '../../hooks/useInventory';
import { analyzeFileForDataExtraction } from '../../services/geminiService';
import type { ExtractedData } from '../../types';

const UploadIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 12 12 7 7 12"/><line x1="12" y1="7" x2="12" y2="21"/></svg>;
const AlertTriangleIcon = (props: React.SVGProps<SVGSVGElement>) => <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>;


const FileAnalyzer: React.FC = () => {
    const { addProduct, addSupplier, addCustomer, addBill } = useInventory();
    const [file, setFile] = useState<File | null>(null);
    const [filePreview, setFilePreview] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
    const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
    const [activeTab, setActiveTab] = useState<keyof ExtractedData | ''>('');
    const [toastMessage, setToastMessage] = useState('');
    
    useEffect(() => {
        if (toastMessage) {
            const timer = setTimeout(() => setToastMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [toastMessage]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = e.target.files?.[0];
        if (selectedFile) {
            setFile(selectedFile);
            setError('');
            setExtractedData(null);

            const reader = new FileReader();
            reader.onloadend = () => {
                setFilePreview(reader.result as string);
                handleAnalyzeFile(reader.result as string, selectedFile.type);
            };
            reader.onerror = () => {
                setError('Failed to read the file.');
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleAnalyzeFile = async (dataUrl: string, mimeType: string) => {
        setIsLoading(true);
        const base64Data = dataUrl.split(',')[1];
        if (!base64Data) {
            setError('Could not process file data.');
            setIsLoading(false);
            return;
        }

        const result = await analyzeFileForDataExtraction(base64Data, mimeType);
        const hasData = Object.values(result).some(arr => Array.isArray(arr) && arr.length > 0);

        if (result && hasData) {
            setExtractedData(result);
            const firstTab = Object.keys(result).find(key => Array.isArray(result[key as keyof ExtractedData]) && result[key as keyof ExtractedData]!.length > 0) as keyof ExtractedData;
            setActiveTab(firstTab || '');
        } else {
            setError('AI could not extract any structured data. Please try a different file or a clearer image.');
        }
        setIsLoading(false);
    };

    const handleImportData = () => {
        if (!extractedData) return;
        let itemsAdded = 0;
        
        extractedData.products?.forEach(p => { addProduct({ ...p, supplierId: '' }); itemsAdded++; }); // Supplier needs manual linking
        extractedData.suppliers?.forEach(s => { addSupplier(s); itemsAdded++; });
        extractedData.customers?.forEach(c => { addCustomer(c); itemsAdded++; });
        extractedData.bills?.forEach(b => { addBill({ ...b, dueDate: new Date(b.dueDate) }); itemsAdded++; });

        setToastMessage(`${itemsAdded} items have been successfully added.`);
        handleClear();
    };

    const handleClear = () => {
        setFile(null);
        setFilePreview(null);
        setExtractedData(null);
        setError('');
        setActiveTab('');
        const fileInput = document.getElementById('file-analyzer-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';
    };

    const hasExtractedData = extractedData && Object.values(extractedData).some(arr => Array.isArray(arr) && arr.length > 0);

    const renderPreviewContent = () => {
        if (!activeTab || !extractedData || !extractedData[activeTab]?.length) return null;

        const data = extractedData[activeTab]!;
        const headers = Object.keys(data[0] || {});

        return (
            <div className="max-h-64 overflow-y-auto">
                <table className="min-w-full text-sm">
                    <thead className="bg-slate-100">
                        <tr>
                            {headers.map(header => <th key={header} className="px-2 py-1 text-left font-medium text-text-secondary capitalize">{header}</th>)}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {data.map((item, index) => (
                            <tr key={index}>
                                {headers.map(header => (
                                    <td key={header} className="px-2 py-1 whitespace-nowrap">
                                        {Array.isArray(item[header as keyof typeof item]) 
                                            ? (item[header as keyof typeof item] as any[]).join(', ') 
                                            : String(item[header as keyof typeof item])}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        );
    };

    return (
        <Card title="AI File Analyzer">
            {toastMessage && (
                <div className="absolute top-4 right-4 z-20 bg-secondary text-white px-4 py-2 rounded-md shadow-lg">
                    {toastMessage}
                </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
                {/* Left Column: Upload and Preview */}
                <div className="space-y-4">
                    <label htmlFor="file-analyzer-input" className="block text-base font-medium text-text-secondary">
                        Upload a receipt, invoice, or product list
                    </label>
                    <div className="flex items-center justify-center w-full">
                        <label htmlFor="file-analyzer-input" className="flex flex-col items-center justify-center w-full h-32 border-2 border-border border-dashed rounded-lg cursor-pointer bg-slate-50 hover:bg-yellow-50">
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                <UploadIcon className="w-8 h-8 mb-3 text-text-secondary" />
                                <p className="mb-2 text-sm text-text-secondary"><span className="font-semibold">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-text-secondary">PNG, JPG, PDF, etc.</p>
                            </div>
                            <input id="file-analyzer-input" type="file" className="hidden" onChange={handleFileChange} />
                        </label>
                    </div>

                    {filePreview && (
                        <div>
                            <h4 className="font-semibold mb-2">File Preview:</h4>
                            <div className="border rounded-md p-2 bg-slate-50 max-h-80 overflow-auto">
                               {file?.type.startsWith('image/') ? (
                                    <img src={filePreview} alt="Uploaded file preview" className="max-w-full h-auto rounded-md" />
                               ) : (
                                    <div className="text-center py-4">
                                        <p className="font-semibold">{file?.name}</p>
                                        <p className="text-sm text-text-secondary">Preview is not available for this file type.</p>
                                    </div>
                               )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Results */}
                <div className="min-h-[20rem]">
                    {isLoading && (
                        <div className="flex flex-col items-center justify-center h-full">
                            <Spinner />
                            <p className="mt-4 text-text-secondary">AI is analyzing your file...</p>
                        </div>
                    )}

                    {error && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full text-center text-red-600 bg-red-50 p-4 rounded-md">
                            <AlertTriangleIcon className="w-8 h-8 mb-2" />
                            <p className="font-semibold">Analysis Failed</p>
                            <p className="text-sm">{error}</p>
                        </div>
                    )}

                    {hasExtractedData && !isLoading && (
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Extracted Data</h3>
                            <p className="text-sm text-text-secondary mb-4">Review the data found in your file. Click "Import Data" to add it to your records.</p>
                            <div className="border-b border-border">
                                <nav className="-mb-px flex space-x-4" aria-label="Tabs">
                                    {Object.keys(extractedData).map(key => {
                                        const dataKey = key as keyof ExtractedData;
                                        if (extractedData[dataKey] && extractedData[dataKey]!.length > 0) {
                                            return (
                                                <button
                                                    key={dataKey}
                                                    onClick={() => setActiveTab(dataKey)}
                                                    className={`${
                                                        activeTab === dataKey
                                                            ? 'border-primary text-primary'
                                                            : 'border-transparent text-text-secondary hover:text-text-primary hover:border-gray-300'
                                                    } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm capitalize`}
                                                >
                                                    {dataKey} ({extractedData[dataKey]!.length})
                                                </button>
                                            );
                                        }
                                        return null;
                                    })}
                                </nav>
                            </div>
                            <div className="mt-4">
                                {renderPreviewContent()}
                            </div>
                            <div className="mt-6 flex gap-4">
                                <Button onClick={handleImportData} className="flex-1">Import Data</Button>
                                <Button variant="ghost" onClick={handleClear} className="flex-1">Clear</Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};

export default FileAnalyzer;
