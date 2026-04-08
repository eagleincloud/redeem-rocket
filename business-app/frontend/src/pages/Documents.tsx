import { useEffect, useState } from 'react'

export default function Documents() {
  const [documents, setDocuments] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const response = await fetch('/api/v1/businesses/my_business/documents/')
      if (response.ok) {
        const data = await response.json()
        setDocuments(data.results || data)
      }
    } catch (error) {
      console.error('Failed to fetch documents:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('document_type', (e.target as any).dataset.type || 'general')

    try {
      const response = await fetch('/api/v1/businesses/my_business/documents/upload/', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        await fetchDocuments()
        e.target.value = ''
      }
    } catch (error) {
      console.error('Failed to upload document:', error)
    } finally {
      setUploading(false)
    }
  }

  if (isLoading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">Documents</h1>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Upload Documents</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {['business_license', 'tax_id', 'owner_id', 'address_proof', 'bank_details'].map(
              (docType) => (
                <div key={docType} className="border-2 border-dashed border-gray-300 rounded p-4">
                  <label className="cursor-pointer">
                    <div className="text-center">
                      <div className="text-3xl mb-2">📄</div>
                      <p className="font-semibold text-gray-900">
                        {docType.replace(/_/g, ' ').toUpperCase()}
                      </p>
                      <input
                        type="file"
                        onChange={handleUpload}
                        data-type={docType}
                        disabled={uploading}
                        className="hidden"
                      />
                    </div>
                  </label>
                </div>
              )
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left py-4 px-6">Document Type</th>
                <th className="text-left py-4 px-6">Upload Date</th>
                <th className="text-left py-4 px-6">Status</th>
                <th className="text-left py-4 px-6">Actions</th>
              </tr>
            </thead>
            <tbody>
              {documents.map((doc: any) => (
                <tr key={doc.id} className="border-b hover:bg-gray-50">
                  <td className="py-4 px-6 font-semibold">{doc.documentType}</td>
                  <td className="py-4 px-6">{new Date(doc.uploadedAt).toLocaleDateString()}</td>
                  <td className="py-4 px-6">
                    <span
                      className={`px-3 py-1 rounded text-sm ${
                        doc.verified
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {doc.verified ? 'Verified' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <button className="text-blue-600 hover:text-blue-700 mr-4">View</button>
                    <button className="text-red-600 hover:text-red-700">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
