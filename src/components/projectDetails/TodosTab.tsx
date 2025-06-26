'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Plus, CheckCircle2, Calendar, Sparkles, RefreshCw, Edit3, Save, X, Trash2 } from 'lucide-react';
import { getProjectTodoList, generateProjectTodoList, updateProjectTodoList } from '@/lib/api/todosClient';
import { TodoListResponse, TodoGenerateRequest, TodoItem } from '@/types/todo';
import { ApiError } from '@/lib/apiBase';

interface TodosTabProps {
  projectId: string;
}

export function TodosTab({ projectId }: TodosTabProps) {
  const { getToken } = useAuth();
  const [todoList, setTodoList] = useState<TodoListResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [updating, setUpdating] = useState(false);

  // Date range for generation
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Editing states
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState('1');
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemDescription, setNewItemDescription] = useState('');
  const [newItemPriority, setNewItemPriority] = useState('1');

  const fetchTodoList = async () => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const todoData = await getProjectTodoList(projectId, token);
      setTodoList(todoData);
    } catch (err) {
      console.error('Error fetching todo list:', err);
      if (err instanceof ApiError) {
        setError(`Failed to load todo list: ${err.message}`);
      } else {
        setError('Failed to load todo list');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodoList();
  }, [projectId]);

  const handleGenerateTodos = async () => {
    if (!startDate || !endDate) {
      setError('Please select both start and end dates');
      return;
    }

    try {
      setGenerating(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const generateRequest: TodoGenerateRequest = {
        start_date: startDate + 'T00:00:00Z',
        end_date: endDate + 'T23:59:59Z',
      };

      const newTodoList = await generateProjectTodoList(projectId, generateRequest, token);
      setTodoList(newTodoList);
    } catch (err) {
      console.error('Error generating todos:', err);
      if (err instanceof ApiError) {
        setError(`Failed to generate todos: ${err.message}`);
      } else {
        setError('Failed to generate todos');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleToggleTodo = async (todoId: string, isCompleted: boolean) => {
    if (!todoList) return;

    try {
      setUpdating(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      // Update the local state immediately for better UX
      const updatedItems = todoList.items.map((item) =>
        item.id === todoId
          ? {
              ...item,
              is_completed: isCompleted,
              completed_at: isCompleted ? new Date().toISOString() : undefined,
              updated_at: new Date().toISOString(),
            }
          : item
      );

      setTodoList({ ...todoList, items: updatedItems });

      // Send update to backend
      await updateProjectTodoList(projectId, { items: updatedItems }, token);
    } catch (err) {
      console.error('Error updating todo:', err);
      // Revert the optimistic update on error
      await fetchTodoList();
      if (err instanceof ApiError) {
        setError(`Failed to update todo: ${err.message}`);
      } else {
        setError('Failed to update todo');
      }
    } finally {
      setUpdating(false);
    }
  };

  const startEditItem = (item: TodoItem) => {
    setEditingItemId(item.id);
    setEditDescription(item.description);
    setEditPriority(item.display_order.toString());
  };

  const cancelEdit = () => {
    setEditingItemId(null);
    setEditDescription('');
    setEditPriority('1');
  };

  const saveEditItem = async () => {
    if (!todoList || !editingItemId || !editDescription.trim()) return;

    try {
      setUpdating(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const updatedItems = todoList.items.map((item) =>
        item.id === editingItemId
          ? {
              ...item,
              description: editDescription.trim(),
              display_order: parseInt(editPriority),
              updated_at: new Date().toISOString(),
            }
          : item
      );

      setTodoList({ ...todoList, items: updatedItems });
      await updateProjectTodoList(projectId, { items: updatedItems }, token);

      // Reset edit state
      cancelEdit();
    } catch (err) {
      console.error('Error saving todo edit:', err);
      await fetchTodoList();
      if (err instanceof ApiError) {
        setError(`Failed to save changes: ${err.message}`);
      } else {
        setError('Failed to save changes');
      }
    } finally {
      setUpdating(false);
    }
  };

  const deleteItem = async (todoId: string) => {
    if (!todoList) return;

    if (!confirm('Are you sure you want to delete this todo item?')) {
      return;
    }

    try {
      setUpdating(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const updatedItems = todoList.items.filter((item) => item.id !== todoId);
      setTodoList({ ...todoList, items: updatedItems });
      await updateProjectTodoList(projectId, { items: updatedItems }, token);
    } catch (err) {
      console.error('Error deleting todo:', err);
      await fetchTodoList();
      if (err instanceof ApiError) {
        setError(`Failed to delete item: ${err.message}`);
      } else {
        setError('Failed to delete item');
      }
    } finally {
      setUpdating(false);
    }
  };

  const addNewItem = async () => {
    if (!todoList || !newItemDescription.trim()) return;

    try {
      setUpdating(true);
      setError(null);

      const token = await getToken();
      if (!token) {
        throw new Error('No authentication token available');
      }

      const newItem: TodoItem = {
        id: `new_${Date.now()}`, // Temporary ID
        description: newItemDescription.trim(),
        is_completed: false,
        display_order: parseInt(newItemPriority),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const updatedItems = [...todoList.items, newItem];
      setTodoList({ ...todoList, items: updatedItems });
      await updateProjectTodoList(projectId, { items: updatedItems }, token);

      // Reset add form
      setShowAddForm(false);
      setNewItemDescription('');
      setNewItemPriority('1');
    } catch (err) {
      console.error('Error adding new todo:', err);
      await fetchTodoList();
      if (err instanceof ApiError) {
        setError(`Failed to add item: ${err.message}`);
      } else {
        setError('Failed to add item');
      }
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString([], {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-16'>
        <div className='text-gray-500'>Loading todo list...</div>
      </div>
    );
  }

  return (
    <div className='space-y-6'>
      {/* Header */}
      <div className='flex items-center justify-between'>
        <div>
          <h3 className='text-lg font-semibold text-gray-900'>Project Todo Lists</h3>
          <p className='text-sm text-gray-600'>AI-generated action items based on project communications</p>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
          <p className='text-red-800'>{error}</p>
          <Button variant='outline' size='sm' onClick={fetchTodoList} className='mt-2'>
            Try Again
          </Button>
        </div>
      )}

      {/* No Todo List State - Generation Form */}
      {!todoList && !loading && (
        <div className='text-center py-12 border-2 border-dashed border-gray-300 rounded-lg'>
          <Sparkles className='h-12 w-12 text-blue-500 mx-auto mb-4' />
          <h4 className='text-lg font-medium text-gray-900 mb-2'>Generate Todo List</h4>
          <p className='text-gray-600 mb-6'>Create an AI-powered todo list based on your project communications</p>

          <div className='max-w-md mx-auto space-y-4'>
            <div className='grid grid-cols-2 gap-4'>
              <div className='space-y-2'>
                <Label htmlFor='start-date'>From Date</Label>
                <Input id='start-date' type='date' value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={generating} />
              </div>
              <div className='space-y-2'>
                <Label htmlFor='end-date'>To Date</Label>
                <Input id='end-date' type='date' value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={generating} />
              </div>
            </div>
            <Button onClick={handleGenerateTodos} disabled={generating || !startDate || !endDate} className='gap-2'>
              <Sparkles className='h-4 w-4' />
              {generating ? 'Generating...' : 'Generate Todo List'}
            </Button>
          </div>
        </div>
      )}

      {/* Existing Todo List */}
      {todoList && (
        <div className='space-y-6'>
          {/* Todo List Header */}
          <Card>
            <CardHeader>
              <div className='flex items-center justify-between'>
                <div>
                  <CardTitle className='flex items-center gap-2'>
                    <Calendar className='h-5 w-5 text-blue-600' />
                    Todo List Summary
                  </CardTitle>
                  <p className='text-sm text-gray-600 mt-1'>
                    {formatDate(todoList.start_date)} - {formatDate(todoList.end_date)}
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge variant='secondary' className='gap-1'>
                    <CheckCircle2 className='h-3 w-3' />
                    {todoList.items.filter((item) => item.is_completed).length} of {todoList.items.length} completed
                  </Badge>
                  <Button variant='outline' size='sm' onClick={() => setTodoList(null)} className='gap-2'>
                    <RefreshCw className='h-4 w-4' />
                    Generate New
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p className='text-gray-700 leading-relaxed'>{todoList.summary}</p>
            </CardContent>
          </Card>

          {/* Todo Items */}
          <div className='space-y-3'>
            {/* Add New Item Form */}
            {showAddForm && (
              <Card className='border-blue-200 bg-blue-50'>
                <CardContent className='p-4'>
                  <div className='space-y-3'>
                    <div className='flex items-center gap-2 mb-3'>
                      <Plus className='h-4 w-4 text-blue-600' />
                      <span className='font-medium text-blue-900'>Add New Todo Item</span>
                    </div>

                    <div className='space-y-3'>
                      <div>
                        <Label htmlFor='new-description' className='text-sm font-medium'>
                          Description
                        </Label>
                        <Textarea
                          id='new-description'
                          value={newItemDescription}
                          onChange={(e) => setNewItemDescription(e.target.value)}
                          placeholder='Enter todo item description...'
                          className='mt-1'
                          rows={2}
                        />
                      </div>

                      <div className='w-32'>
                        <Label htmlFor='new-priority' className='text-sm font-medium'>
                          Priority
                        </Label>
                        <Select value={newItemPriority} onValueChange={setNewItemPriority}>
                          <SelectTrigger className='mt-1'>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {[1, 2, 3, 4, 5].map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                Priority {num}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className='flex items-center gap-2 pt-2'>
                      <Button size='sm' onClick={addNewItem} disabled={!newItemDescription.trim() || updating} className='gap-2'>
                        <Save className='h-4 w-4' />
                        Add Item
                      </Button>
                      <Button
                        size='sm'
                        variant='outline'
                        onClick={() => {
                          setShowAddForm(false);
                          setNewItemDescription('');
                          setNewItemPriority('1');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Add New Item Button */}
            {!showAddForm && (
              <Card className='border-2 border-dashed border-gray-300 hover:border-blue-400 hover:bg-blue-50 cursor-pointer transition-colors'>
                <CardContent className='p-4'>
                  <button onClick={() => setShowAddForm(true)} className='w-full flex items-center justify-center gap-2 text-gray-600 hover:text-blue-600'>
                    <Plus className='h-4 w-4' />
                    Add New Todo Item
                  </button>
                </CardContent>
              </Card>
            )}

            {/* Existing Todo Items */}
            {todoList.items
              .sort((a, b) => a.display_order - b.display_order)
              .map((item) => (
                <Card key={item.id} className='hover:shadow-md transition-shadow'>
                  <CardContent className='p-4'>
                    {editingItemId === item.id ? (
                      // Edit Mode
                      <div className='space-y-3'>
                        <div className='flex items-center gap-2 mb-3'>
                          <Edit3 className='h-4 w-4 text-blue-600' />
                          <span className='font-medium text-blue-900'>Editing Todo Item</span>
                        </div>

                        <div className='space-y-3'>
                          <div>
                            <Label htmlFor='edit-description' className='text-sm font-medium'>
                              Description
                            </Label>
                            <Textarea id='edit-description' value={editDescription} onChange={(e) => setEditDescription(e.target.value)} className='mt-1' rows={2} />
                          </div>

                          <div className='w-32'>
                            <Label htmlFor='edit-priority' className='text-sm font-medium'>
                              Priority
                            </Label>
                            <Select value={editPriority} onValueChange={setEditPriority}>
                              <SelectTrigger className='mt-1'>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {[1, 2, 3, 4, 5].map((num) => (
                                  <SelectItem key={num} value={num.toString()}>
                                    Priority {num}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div className='flex items-center gap-2 pt-2'>
                          <Button size='sm' onClick={saveEditItem} disabled={!editDescription.trim() || updating} className='gap-2'>
                            <Save className='h-4 w-4' />
                            Save Changes
                          </Button>
                          <Button size='sm' variant='outline' onClick={cancelEdit}>
                            <X className='h-4 w-4' />
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : (
                      // View Mode
                      <div className='flex items-start gap-3'>
                        <Checkbox checked={item.is_completed} onCheckedChange={(checked) => handleToggleTodo(item.id, !!checked)} disabled={updating} className='mt-1' />
                        <div className='flex-1'>
                          <p className={`text-gray-900 leading-relaxed ${item.is_completed ? 'line-through text-gray-500' : ''}`}>{item.description}</p>
                          {item.completed_at && <p className='text-xs text-gray-500 mt-1'>Completed on {formatDate(item.completed_at)}</p>}
                        </div>
                        <div className='flex items-center gap-2'>
                          <Badge variant='outline' className='text-xs'>
                            Priority {item.display_order}
                          </Badge>
                          <Button size='sm' variant='ghost' onClick={() => startEditItem(item)} disabled={updating} className='h-8 w-8 p-0'>
                            <Edit3 className='h-4 w-4' />
                          </Button>
                          <Button size='sm' variant='ghost' onClick={() => deleteItem(item.id)} disabled={updating} className='h-8 w-8 p-0 text-red-600 hover:text-red-700'>
                            <Trash2 className='h-4 w-4' />
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}
