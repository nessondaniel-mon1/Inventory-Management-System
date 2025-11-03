import React, { useState, useEffect } from 'react';
import Card from '../ui/Card';
import Button from '../ui/Button';
import Spinner from '../ui/Spinner';
import { useInventory } from '../../hooks/useInventory';
import { generateReport } from '../../services/geminiService';
import { jsPDF } from 'jspdf';

const DownloadIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
);
const PrinterIcon = (props: React.SVGProps<SVGSVGElement>) => (
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
);

// A simple component to handle the print view
const PrintableView = ({ content }: { content: string }) => (
    <div className="printable-report">
        <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word', fontFamily: 'sans-serif' }}>
            {content}
        </pre>
    </div>
);


const ReportGenerator: React.FC = () => {
    const inventory = useInventory();
    const [prompt, setPrompt] = useState('');
    const [report, setReport] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isPrinting, setIsPrinting] = useState(false);

    const handleGenerateReport = async () => {
        if (!prompt.trim()) return;
        setIsLoading(true);
        setReport('');

        const { getProductName, getCustomerName, getEmployeeName, getSupplierName, ...contextData } = inventory;
        
        // Create a serializable context object
        const context = {
            products: contextData.products,
            suppliers: contextData.suppliers,
            customers: contextData.customers,
            sales: contextData.sales,
            // FIX: The context provides `users`, which is correctly mapped to `employees` for the AI prompt.
            employees: contextData.users,
            supplies: contextData.supplies,
            stockUpdates: contextData.stockUpdates,
            bills: contextData.bills,
            payments: contextData.payments,
        };

        const result = await generateReport(prompt, context);
        setReport(result);
        setIsLoading(false);
    };

    const downloadFile = (content: string, fileName: string, mimeType: string) => {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const handleExportCSV = () => {
        downloadFile(report, 'report.csv', 'text/csv;charset=utf-8;');
    };
    
    const handleExportJSON = () => {
        const jsonContent = JSON.stringify({
            prompt: prompt,
            generatedReport: report,
            generatedAt: new Date().toISOString(),
        }, null, 2);
        downloadFile(jsonContent, 'report.json', 'application/json');
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10);

        const margin = 15;
        const pageHeight = doc.internal.pageSize.getHeight();
        const usableWidth = doc.internal.pageSize.getWidth() - margin * 2;
        
        const lines = doc.splitTextToSize(report, usableWidth);
        
        let cursorY = margin;

        lines.forEach((line: string) => {
            if (cursorY + 10 > pageHeight - margin) {
                doc.addPage();
                cursorY = margin;
            }
            doc.text(line, margin, cursorY);
            cursorY += 7;
        });

        doc.save("report.pdf");
    };

    const handlePrint = () => {
        setIsPrinting(true);
    };

    useEffect(() => {
        if (isPrinting) {
            window.print();
        }
    }, [isPrinting]);

    useEffect(() => {
        const handleAfterPrint = () => {
            setIsPrinting(false);
        };
        window.addEventListener('afterprint', handleAfterPrint);
        return () => {
            window.removeEventListener('afterprint', handleAfterPrint);
        };
    }, []);

    return (
        <Card title="AI-Powered Report Generator">
            {isPrinting && <PrintableView content={report} />}
            <div className="space-y-4">
                <div>
                    <label htmlFor="report-prompt" className="block text-base font-medium text-text-secondary mb-1">
                        Enter your report request
                    </label>
                    <textarea
                        id="report-prompt"
                        rows={3}
                        className="block w-full px-3 py-2 border border-border rounded-md shadow-sm bg-slate-50 text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-primary focus:border-primary sm:text-base"
                        placeholder="e.g., 'Generate a summary of sales for the last 7 days, broken down by product' or 'List all unpaid invoices sorted by due date'"
                        value={prompt}
                        onChange={(e) => setPrompt(e.target.value)}
                    />
                </div>
                <Button onClick={handleGenerateReport} disabled={isLoading || !prompt.trim()}>
                    {isLoading ? 'Generating...' : 'Generate Report'}
                </Button>

                {(isLoading || report) && (
                     <div className="mt-4 pt-4 border-t">
                        <h4 className="text-lg font-semibold mb-2">Generated Report</h4>
                        {isLoading ? (
                            <div className="flex items-center justify-center h-48">
                                <Spinner />
                                <p className="ml-4 text-text-secondary">AI is preparing your report...</p>
                            </div>
                        ) : (
                            <>
                                <div className="p-4 bg-slate-50 border rounded-md max-h-96 overflow-y-auto">
                                    <pre className="whitespace-pre-wrap break-words font-sans text-base">
                                        {report}
                                    </pre>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mt-4">
                                    <Button size="sm" variant="ghost" onClick={handleExportCSV} leftIcon={<DownloadIcon className="w-4 h-4" />} className="px-4 whitespace-nowrap">
                                        Download CSV
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={handleExportJSON} leftIcon={<DownloadIcon className="w-4 h-4" />} className="px-4 whitespace-nowrap">
                                        Download JSON
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={handleExportPDF} leftIcon={<DownloadIcon className="w-4 h-4" />} className="px-4 whitespace-nowrap">
                                        Download PDF
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={handlePrint} leftIcon={<PrinterIcon className="w-4 h-4" />} className="px-4 whitespace-nowrap">
                                        Print
                                    </Button>
                                </div>
                            </>
                        )}
                    </div>
                )}
            </div>
        </Card>
    );
};

export default ReportGenerator;