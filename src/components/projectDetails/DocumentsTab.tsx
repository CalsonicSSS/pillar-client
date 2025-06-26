'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Upload, FileText, Image, File, Download, Trash2, Search, MoreHorizontal, Paperclip, Calendar, FolderOpen, Plus } from 'lucide-react';
import { getProjectDocuments, uploadDocument, deleteDocument, getDocumentDownload } from '@/lib/api/documentsClient';
import { DocumentResponse } from '@/types/document';
import { ApiError } from '@/lib/apiBase';

interface DocumentsTabProps {
  projectId: string;
}

export function DocumentsTab({ projectId }: DocumentsTabProps) {
  const { getToken } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [documents, setDocuments] = useState<DocumentResponse[]>([]);
  const [filteredDocuments, setFilteredDocuments] = useState<DocumentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sourceFilter, setSourceFilter] = useState<'all' | 'email' | 'manual'>('all');
  const [dragActive, setDragActive] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const documentsData = await getProjectDocuments(projectId, token);

      // Sort by created date (newest first)
      const sortedDocuments = documentsData.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setDocuments(sortedDocuments);
    } catch (err) {
      console.error('Error fetching documents:', err);
      if (err instanceof ApiError) {
        setError(`Failed to load documents: ${err.message}`);
      } else {
        setError('Failed to load documents');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, [projectId]);

  // Filter documents based on search and source filter
  useEffect(() => {
    let filtered = documents;

    // Apply source filter
    if (sourceFilter !== 'all') {
      filtered = filtered.filter((doc) => doc.source === sourceFilter);
    }

    // Apply search filter
    if (searchTerm) {
      filtered = filtered.filter(
        (doc) =>
          doc.original_file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.safe_file_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          doc.file_type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredDocuments(filtered);
  }, [documents, searchTerm, sourceFilter]);

  const handleFileUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    try {
      setUploading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      await uploadDocument(projectId, file, token);
      await fetchDocuments(); // Refresh the list

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      if (err instanceof ApiError) {
        setError(`Failed to upload document: ${err.message}`);
      } else {
        setError('Failed to upload document');
      }
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteDocument = async (document: DocumentResponse) => {
    if (!confirm(`Are you sure you want to delete "${document.original_file_name || document.safe_file_name}"?`)) {
      return;
    }

    try {
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      await deleteDocument(document.id, token);
      await fetchDocuments(); // Refresh the list
    } catch (err) {
      console.error('Error deleting document:', err);
      if (err instanceof ApiError) {
        setError(`Failed to delete document: ${err.message}`);
      } else {
        setError('Failed to delete document');
      }
    }
  };

  const handleDownloadDocument = async (document: DocumentResponse) => {
    try {
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const downloadResponse = await getDocumentDownload(document.id, token);

      // Open download URL in new tab
      window.open(downloadResponse.download_url, '_blank');
    } catch (err) {
      console.error('Error downloading document:', err);
      if (err instanceof ApiError) {
        setError(`Failed to download document: ${err.message}`);
      } else {
        setError('Failed to download document');
      }
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files);
    }
  };

  const getFileIcon = (fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <Image className='h-5 w-5 text-green-600' />;
    } else if (fileType.includes('pdf')) {
      return <FileText className='h-5 w-5 text-red-600' />;
    } else {
      return <File className='h-5 w-5 text-blue-600' />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='text-gray-500'>Loading documents...</div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>Project Documents</h3>
          <p className='text-sm text-gray-600'>Manage files and attachments for this project</p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={uploading} className='gap-2'>
          <Upload className='h-4 w-4' />
          {uploading ? 'Uploading...' : 'Upload File'}
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className='flex items-center gap-4 bg-white p-4 rounded-lg border border-gray-200'>
        <div className='flex-1 relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400' />
          <Input placeholder='Search documents...' value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className='pl-10' />
        </div>

        <Select value={sourceFilter} onValueChange={(value: any) => setSourceFilter(value)}>
          <SelectTrigger className='w-48'>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value='all'>All Documents</SelectItem>
            <SelectItem value='email'>Email Attachments</SelectItem>
            <SelectItem value='manual'>Manual Uploads</SelectItem>
          </SelectContent>
        </Select>

        <Badge variant='secondary' className='gap-1'>
          <FileText className='h-3 w-3' />
          {filteredDocuments.length} of {documents.length}
        </Badge>
      </div>

      {/* Hidden File Input */}
      <input ref={fileInputRef} type='file' className='hidden' onChange={(e) => handleFileUpload(e.target.files)} accept='*/*' />

      {/* Error State */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-800'>{error}</p>
          <Button variant='outline' size='sm' onClick={fetchDocuments} className='mt-2'>
            Try Again
          </Button>
        </div>
      )}

      {/* Documents Grid */}
      {documents.length === 0 ? (
        <div className='text-center py-12 border-2 border-dashed border-gray-300 rounded-lg'>
          <FolderOpen className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h4 className='text-lg font-medium text-gray-900 mb-2'>No documents yet</h4>
          <p className='text-gray-600 mb-4'>Upload your first document or add Gmail contacts to automatically import email attachments</p>
          <Button onClick={() => fileInputRef.current?.click()} className='gap-2'>
            <Plus className='h-4 w-4' />
            Upload Your First Document
          </Button>
        </div>
      ) : (
        <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'>
          {/* Upload Card - Always First */}
          <Card
            className={`border-2 border-dashed cursor-pointer hover:shadow-md transition-all ${
              dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
            }`}
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <CardContent className='flex flex-col items-center justify-center p-8 text-center h-full min-h-[240px]'>
              <div className='w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4'>
                <Upload className='h-6 w-6 text-blue-600' />
              </div>
              <h4 className='font-medium text-gray-900 mb-2'>{uploading ? 'Uploading...' : 'Upload File'}</h4>
              <p className='text-sm text-gray-600 mb-2'>{uploading ? 'Please wait...' : 'Click or drag files here'}</p>
              <p className='text-xs text-gray-500'>All file types supported</p>
            </CardContent>
          </Card>

          {/* Document Cards */}
          {filteredDocuments.map((document) => (
            <Card key={document.id} className='hover:shadow-md transition-shadow group'>
              <CardHeader className='pb-4'>
                <div className='flex items-center justify-between mb-3'>
                  <div className='flex-shrink-0'>{getFileIcon(document.file_type)}</div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant='ghost' size='sm' className='h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity'>
                        <MoreHorizontal className='h-4 w-4' />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align='end'>
                      <DropdownMenuItem onClick={() => handleDownloadDocument(document)}>
                        <Download className='h-4 w-4 mr-2' />
                        Download
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDeleteDocument(document)} className='text-red-600'>
                        <Trash2 className='h-4 w-4 mr-2' />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                <div>
                  <CardTitle className='text-sm font-medium leading-tight mb-2 break-words'>{document.original_file_name || document.safe_file_name}</CardTitle>{' '}
                  <p className='text-xs text-gray-500 mb-3'>{formatFileSize(document.file_size)}</p>
                </div>
              </CardHeader>

              <CardContent className='pt-0'>
                <div className='space-y-4'>
                  {/* Source Section */}
                  <div>
                    <div className='flex items-center justify-between mb-2'>
                      <span className='text-xs font-medium text-gray-700 uppercase tracking-wider'>Source</span>
                      <Badge variant={document.source === 'email' ? 'default' : 'secondary'} className='text-xs px-2 py-1'>
                        {document.source === 'email' ? (
                          <>
                            <Paperclip className='h-3 w-3 mr-1' />
                            Email
                          </>
                        ) : (
                          <>
                            <Upload className='h-3 w-3 mr-1' />
                            Manual
                          </>
                        )}
                      </Badge>
                    </div>
                  </div>

                  {/* Added Section */}
                  <div>
                    <div className='mb-3'>
                      <span className='text-xs font-medium text-gray-700 uppercase tracking-wider block mb-1'>Added</span>
                      <span className='text-xs text-gray-600 flex items-center gap-1'>
                        <Calendar className='h-3 w-3' />
                        {formatDate(document.created_at)}
                      </span>
                    </div>
                  </div>

                  <Button variant='outline' size='sm' className='w-full gap-2' onClick={() => handleDownloadDocument(document)}>
                    <Download className='h-4 w-4' />
                    Download
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* No Results State */}
      {documents.length > 0 && filteredDocuments.length === 0 && (
        <div className='text-center py-12 border-2 border-dashed border-gray-300 rounded-lg'>
          <Search className='h-12 w-12 text-gray-400 mx-auto mb-4' />
          <h4 className='text-lg font-medium text-gray-900 mb-2'>No matching documents</h4>
          <p className='text-gray-600'>Try adjusting your search or filter criteria</p>
        </div>
      )}
    </div>
  );
}
