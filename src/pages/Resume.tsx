import React, { useState, useEffect } from 'react';

const Resume: React.FC = () => {
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string>('');
  const [iframeError, setIframeError] = useState(false);

  useEffect(() => {
    // Determine the correct PDF URL based on environment
    const baseUrl = import.meta.env.PROD ? '/AndyLiu-Website/public' : '';
    setPdfUrl(`${baseUrl}/Resume_Chia-Da-Liu.pdf`);
  }, []);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = pdfUrl;
    link.download = 'Resume_Chia-Da-Liu.pdf';
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setShowDownloadModal(false);
  };

  const handleIframeError = () => {
    setIframeError(true);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-16 pt-24">
      <h1 className="font-cormorant font-bold text-4xl mb-12 text-center">
        Resume
      </h1>
      
      <div className="max-w-4xl mx-auto">
        {/* PDF Preview */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {!iframeError ? (
            <iframe
              src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=0&view=FitH&disablelinks=1`}
              className="w-full h-[800px] md:h-[1000px]"
              title="Resume Preview"
              style={{
                pointerEvents: 'none'
              }}
              onError={handleIframeError}
            />
          ) : (
            <div className="w-full h-[800px] md:h-[1000px] bg-gray-100 flex items-center justify-center">
              <div className="text-center">
                <div className="text-6xl mb-4">📄</div>
                <p className="text-gray-600 mb-4">PDF preview not available</p>
                <button
                  onClick={() => window.open(pdfUrl, '_blank')}
                  className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors duration-200"
                >
                  Open PDF in New Tab
                </button>
              </div>
            </div>
          )}
          <div className="p-4 text-center text-sm text-gray-600 bg-gray-50 border-t">
            <p>📄 Links are disabled in preview. Download PDF for full link access.</p>
          </div>
        </div>
        
        {/* Download Button */}
        <div className="mt-8 text-center">
          <button
            onClick={() => setShowDownloadModal(true)}
            className="bg-black text-white px-8 py-3 rounded-lg hover:bg-gray-800 transition-colors duration-200 font-medium"
          >
            Download Resume 
          </button>
        </div>
      </div>

      {/* Download Confirmation Modal */}
      {showDownloadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md mx-4">
            <h3 className="text-xl font-semibold mb-4">Download Resume</h3>
            <p className="text-gray-600 mb-6">
              Would you like to download the resume as a PDF file?
            </p>
            <div className="flex space-x-4">
              <button
                onClick={handleDownload}
                className="bg-black text-white px-6 py-2 rounded hover:bg-gray-800 transition-colors duration-200"
              >
                Yes, Download
              </button>
              <button
                onClick={() => setShowDownloadModal(false)}
                className="bg-gray-300 text-gray-700 px-6 py-2 rounded hover:bg-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Resume;