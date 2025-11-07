import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Layout from "@/components/Layout";
import { Move, Square, Circle, Type, Link, Trash2, Upload, Link2, X, Bold, Italic, Underline, ArrowLeft, Plus, Lightbulb } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

export default function Brainstorming() {
  const { user } = useAuth();
  const [tool, setTool] = useState('select');
  const [elements, setElements] = useState([]);
  const [connections, setConnections] = useState([]);
  const [selected, setSelected] = useState(null);
  const [drawingConnection, setDrawingConnection] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [drawing, setDrawing] = useState(null);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showTextModal, setShowTextModal] = useState(false);
  const [textInput, setTextInput] = useState('');
  const [textPosition, setTextPosition] = useState(null);
  const [imageUrl, setImageUrl] = useState('');
  const [activeCanvas, setActiveCanvas] = useState<string | null>(null);
  const [canvasList, setCanvasList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newCanvasName, setNewCanvasName] = useState('');
  const canvasRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadCanvasList();
  }, []);

  useEffect(() => {
    if (activeCanvas && (elements.length > 0 || connections.length > 0)) {
      saveData();
    }
  }, [elements, connections, activeCanvas]);

  const loadCanvasList = async () => {
    try {
      const { data } = await supabase
        .from("brainstorming_canvas")
        .select("*")
        .order("updated_at", { ascending: false });
      
      setCanvasList(data || []);
    } catch (error) {
      console.log('Error loading canvas list');
    }
    setLoading(false);
  };

  const loadCanvas = async (canvasId: string) => {
    try {
      const { data } = await supabase
        .from("brainstorming_canvas")
        .select("*")
        .eq("id", canvasId)
        .single();
      
      if (data?.canvas_data && typeof data.canvas_data === 'object') {
        const canvasData = data.canvas_data as any;
        setElements(canvasData.elements || []);
        setConnections(canvasData.connections || []);
      }
      setActiveCanvas(canvasId);
    } catch (error) {
      console.log('Error loading canvas');
      toast.error("Erro ao carregar canvas");
    }
  };

  const saveData = async () => {
    if (!user || !activeCanvas) return;
    
    try {
      const canvasData = { elements, connections };
      
      await supabase
        .from("brainstorming_canvas")
        .update({ 
          canvas_data: canvasData,
          updated_by: user.id 
        })
        .eq("id", activeCanvas);
    } catch (error) {
      console.error('Error saving:', error);
    }
  };

  const handleCreateCanvas = async () => {
    if (!user || !newCanvasName.trim()) {
      toast.error("Digite um nome para o canvas");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from("brainstorming_canvas")
        .insert({ 
          name: newCanvasName,
          canvas_data: { elements: [], connections: [] }, 
          created_by: user.id,
          updated_by: user.id
        })
        .select()
        .single();

      if (error) {
        toast.error("Erro ao criar canvas");
      } else {
        toast.success("Canvas criado!");
        setNewCanvasName('');
        setShowCreateDialog(false);
        loadCanvas(data.id);
      }
    } catch (error) {
      console.error('Error creating canvas:', error);
    }
  };

  const handleDeleteCanvas = async (canvasId: string) => {
    if (!confirm("Tem certeza que deseja excluir este canvas?")) return;

    try {
      await supabase
        .from("brainstorming_canvas")
        .delete()
        .eq("id", canvasId);
      
      toast.success("Canvas excluído!");
      if (activeCanvas === canvasId) {
        setActiveCanvas(null);
        setElements([]);
        setConnections([]);
      }
      loadCanvasList();
    } catch (error) {
      toast.error("Erro ao excluir canvas");
    }
  };

  const handleBackToList = () => {
    setActiveCanvas(null);
    setElements([]);
    setConnections([]);
    setSelected(null);
    loadCanvasList();
  };

  const getMousePos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e) => {
    const pos = getMousePos(e);
    
    if (tool === 'select') {
      if (selected) {
        const elem = elements.find(el => el.id === selected);
        if (elem && isOnResizeHandle(pos, elem)) {
          setResizing({ id: selected, start: pos, original: { ...elem } });
          return;
        }
      }
      
      const clicked = findElementAtPos(pos);
      if (clicked) {
        setSelected(clicked.id);
        setDragging({ id: clicked.id, offsetX: pos.x - clicked.x, offsetY: pos.y - clicked.y });
      } else {
        setSelected(null);
      }
    } else if (tool === 'connect') {
      setDrawingConnection({ start: pos, end: pos, from: null, to: null });
    } else if (tool === 'delete') {
      const clicked = findElementAtPos(pos);
      if (clicked) {
        setElements(elements.filter(el => el.id !== clicked.id));
        setConnections(connections.filter(c => c.from !== clicked.id && c.to !== clicked.id));
        setSelected(null);
      }
    } else if (['rectangle', 'circle'].includes(tool)) {
      setDrawing({ start: pos, current: pos });
    } else if (tool === 'text') {
      setTextPosition({ x: pos.x - 50, y: pos.y - 15 });
      setShowTextModal(true);
    }
  };

  const handleMouseMove = (e) => {
    const pos = getMousePos(e);
    
    if (dragging) {
      setElements(elements.map(el => 
        el.id === dragging.id 
          ? { ...el, x: pos.x - dragging.offsetX, y: pos.y - dragging.offsetY }
          : el
      ));
    } else if (resizing) {
      const dx = pos.x - resizing.start.x;
      const dy = pos.y - resizing.start.y;
      setElements(elements.map(el => 
        el.id === resizing.id
          ? { ...el, width: Math.max(20, resizing.original.width + dx), height: Math.max(20, resizing.original.height + dy) }
          : el
      ));
    } else if (drawing) {
      setDrawing({ ...drawing, current: pos });
    } else if (drawingConnection) {
      setDrawingConnection({ ...drawingConnection, end: pos });
    }
  };

  const handleMouseUp = () => {
    if (drawing) {
      const width = Math.abs(drawing.current.x - drawing.start.x);
      const height = Math.abs(drawing.current.y - drawing.start.y);
      if (width > 10 && height > 10) {
        setElements([...elements, {
          id: Date.now(),
          type: tool,
          x: Math.min(drawing.start.x, drawing.current.x),
          y: Math.min(drawing.start.y, drawing.current.y),
          width,
          height,
          color: tool === 'rectangle' ? '#3b82f6' : '#10b981'
        }]);
      }
      setDrawing(null);
      setTool('select');
    } else if (drawingConnection) {
      const fromElem = findElementAtPos(drawingConnection.start);
      const toElem = findElementAtPos(drawingConnection.end);
      
      if (fromElem && toElem && fromElem.id !== toElem.id) {
        setConnections([...connections, {
          id: Date.now(),
          from: fromElem.id,
          to: toElem.id
        }]);
      }
      setDrawingConnection(null);
    }
    setDragging(null);
    setResizing(null);
  };

  const findElementAtPos = (pos) => {
    return [...elements].reverse().find(el => {
      return pos.x >= el.x && pos.x <= el.x + el.width &&
             pos.y >= el.y && pos.y <= el.y + el.height;
    });
  };

  const isOnResizeHandle = (pos, elem) => {
    const handleSize = 8;
    const handleX = elem.x + elem.width;
    const handleY = elem.y + elem.height;
    return pos.x >= handleX - handleSize && pos.x <= handleX + handleSize &&
           pos.y >= handleY - handleSize && pos.y <= handleY + handleSize;
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user) return;
    
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from("brainstorming-images")
      .upload(fileName, file);

    if (uploadError) {
      toast.error("Erro ao fazer upload");
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("brainstorming-images")
      .getPublicUrl(fileName);

    const rect = canvasRef.current.getBoundingClientRect();
    setElements([...elements, {
      id: Date.now(),
      type: 'image',
      x: rect.width / 2 - 50,
      y: rect.height / 2 - 50,
      width: 100,
      height: 100,
      src: publicUrl
    }]);
    setShowImageModal(false);
    toast.success("Imagem adicionada!");
  };

  const handleImageUrl = () => {
    if (imageUrl && imageUrl.trim()) {
      const rect = canvasRef.current.getBoundingClientRect();
      setElements([...elements, {
        id: Date.now(),
        type: 'image',
        x: rect.width / 2 - 50,
        y: rect.height / 2 - 50,
        width: 100,
        height: 100,
        src: imageUrl
      }]);
      setImageUrl('');
      setShowImageModal(false);
    }
  };

  const handleAddText = () => {
    if (textInput && textInput.trim()) {
      setElements([...elements, {
        id: Date.now(),
        type: 'text',
        x: textPosition.x,
        y: textPosition.y,
        width: 100,
        height: 30,
        text: textInput,
        fontSize: 16,
        fontWeight: 'normal',
        fontStyle: 'normal',
        textDecoration: 'none',
        color: '#000000'
      }]);
      setTextInput('');
      setShowTextModal(false);
      setTool('select');
    }
  };

  const handleClearAll = async () => {
    if (window.confirm('Tem certeza que deseja limpar tudo neste canvas?')) {
      setElements([]);
      setConnections([]);
      setSelected(null);
      
      if (activeCanvas) {
        await supabase
          .from("brainstorming_canvas")
          .update({ canvas_data: { elements: [], connections: [] } })
          .eq("id", activeCanvas);
      }
      
      toast.success("Canvas limpo!");
    }
  };

  const updateSelectedElement = (updates) => {
    setElements(elements.map(el => 
      el.id === selected ? { ...el, ...updates } : el
    ));
  };

  const toggleTextStyle = (style) => {
    const elem = elements.find(el => el.id === selected);
    if (!elem || elem.type !== 'text') return;

    if (style === 'bold') {
      updateSelectedElement({ fontWeight: elem.fontWeight === 'bold' ? 'normal' : 'bold' });
    } else if (style === 'italic') {
      updateSelectedElement({ fontStyle: elem.fontStyle === 'italic' ? 'normal' : 'italic' });
    } else if (style === 'underline') {
      updateSelectedElement({ textDecoration: elem.textDecoration === 'underline' ? 'none' : 'underline' });
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Delete' && selected) {
      setElements(elements.filter(el => el.id !== selected));
      setConnections(connections.filter(c => c.from !== selected && c.to !== selected));
      setSelected(null);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selected, elements, connections]);

  const getCenter = (elem) => ({
    x: elem.x + elem.width / 2,
    y: elem.y + elem.height / 2
  });

  const selectedElement = elements.find(el => el.id === selected);

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </Layout>
    );
  }

  // Lista de canvas (quando nenhum está ativo)
  if (!activeCanvas) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="flex items-center gap-2 text-3xl font-bold">
                <Lightbulb className="h-8 w-8 text-primary" />
                Brainstorming GEARS
              </h1>
              <p className="text-muted-foreground">Canvas colaborativos para ideias</p>
            </div>
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Canvas
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Criar Novo Canvas</DialogTitle>
                  <DialogDescription>
                    Dê um nome para o seu canvas de brainstorming
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="canvas-name">Nome do Canvas</Label>
                    <Input
                      id="canvas-name"
                      value={newCanvasName}
                      onChange={(e) => setNewCanvasName(e.target.value)}
                      placeholder="Ex: Ideias para o Robô"
                      onKeyPress={(e) => e.key === 'Enter' && handleCreateCanvas()}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleCreateCanvas} className="flex-1">
                      Criar
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setShowCreateDialog(false);
                        setNewCanvasName('');
                      }}
                    >
                      Cancelar
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {canvasList.map((canvas) => (
              <Card key={canvas.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-lg">{canvas.name}</CardTitle>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDeleteCanvas(canvas.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">
                    Atualizado em: {new Date(canvas.updated_at).toLocaleDateString('pt-BR')}
                  </p>
                  <Button 
                    className="w-full"
                    onClick={() => loadCanvas(canvas.id)}
                  >
                    Abrir Canvas
                  </Button>
                </CardContent>
              </Card>
            ))}
            {canvasList.length === 0 && (
              <div className="col-span-full py-12 text-center">
                <Lightbulb className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
                <p className="text-muted-foreground">Nenhum canvas criado ainda</p>
              </div>
            )}
          </div>
        </div>
      </Layout>
    );
  }

  // Editor do canvas (quando um está ativo)
  return (
    <div className="w-full h-screen flex flex-col bg-background">
      <div className="bg-card shadow-md p-3 flex gap-2 flex-wrap items-center border-b">
        <Button
          variant="ghost"
          size="icon"
          onClick={handleBackToList}
          title="Voltar para lista"
        >
          <ArrowLeft size={20} />
        </Button>
        
        <div className="border-l border-border h-8 mx-2" />
        <button
          onClick={() => setTool('select')}
          className={`p-2 rounded ${tool === 'select' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          title="Selecionar (mover/redimensionar)"
        >
          <Move size={20} />
        </button>
        <button
          onClick={() => setTool('rectangle')}
          className={`p-2 rounded ${tool === 'rectangle' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          title="Retângulo"
        >
          <Square size={20} />
        </button>
        <button
          onClick={() => setTool('circle')}
          className={`p-2 rounded ${tool === 'circle' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          title="Círculo"
        >
          <Circle size={20} />
        </button>
        <button
          onClick={() => setTool('text')}
          className={`p-2 rounded ${tool === 'text' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          title="Texto"
        >
          <Type size={20} />
        </button>
        <button
          onClick={() => setShowImageModal(true)}
          className="p-2 rounded bg-muted"
          title="Imagem"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </button>
        <button
          onClick={() => setTool('connect')}
          className={`p-2 rounded ${tool === 'connect' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
          title="Conectar elementos (arraste)"
        >
          <Link size={20} />
        </button>
        <button
          onClick={() => setTool('delete')}
          className={`p-2 rounded ${tool === 'delete' ? 'bg-destructive text-destructive-foreground' : 'bg-muted'}`}
          title="Deletar"
        >
          <Trash2 size={20} />
        </button>
        
        <div className="border-l border-border h-8 mx-2" />
        
        <button
          onClick={handleClearAll}
          className="p-2 rounded bg-destructive/10 text-destructive hover:bg-destructive/20 flex items-center gap-1"
          title="Limpar tudo"
        >
          <X size={20} />
          <span className="text-sm font-medium">Limpar Tudo</span>
        </button>
        
        <div className="ml-auto text-sm text-muted-foreground flex items-center gap-4">
          {tool === 'connect' && <span className="text-primary font-semibold">Arraste de um elemento para outro</span>}
          {selected && <span className="text-primary">Delete para remover | Arraste cantos para redimensionar</span>}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        <div 
          ref={canvasRef}
          className="flex-1 relative bg-card overflow-hidden cursor-crosshair"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        >
          <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
            {connections.map(conn => {
              const from = elements.find(el => el.id === conn.from);
              const to = elements.find(el => el.id === conn.to);
              if (!from || !to) return null;
              const fromCenter = getCenter(from);
              const toCenter = getCenter(to);
              return (
                <line
                  key={conn.id}
                  x1={fromCenter.x}
                  y1={fromCenter.y}
                  x2={toCenter.x}
                  y2={toCenter.y}
                  stroke="hsl(var(--primary))"
                  strokeWidth="2"
                />
              );
            })}
            
            {drawingConnection && (
              <line
                x1={drawingConnection.start.x}
                y1={drawingConnection.start.y}
                x2={drawingConnection.end.x}
                y2={drawingConnection.end.y}
                stroke="hsl(var(--primary))"
                strokeWidth="2"
                strokeDasharray="5,5"
              />
            )}
          </svg>

          {elements.map(elem => (
            <div
              key={elem.id}
              className={`absolute ${selected === elem.id ? 'ring-2 ring-primary' : ''}`}
              style={{
                left: elem.x,
                top: elem.y,
                width: elem.width,
                height: elem.height
              }}
            >
              {elem.type === 'rectangle' && (
                <div className="w-full h-full border-2" style={{ backgroundColor: elem.color || '#3b82f6', borderColor: elem.color || '#3b82f6' }} />
              )}
              {elem.type === 'circle' && (
                <div className="w-full h-full border-2 rounded-full" style={{ backgroundColor: elem.color || '#10b981', borderColor: elem.color || '#10b981' }} />
              )}
              {elem.type === 'text' && (
                <div 
                  className="w-full h-full flex items-center justify-center bg-yellow-100 border-2 border-yellow-500 p-1 overflow-hidden"
                  style={{
                    fontSize: `${elem.fontSize || 16}px`,
                    fontWeight: elem.fontWeight || 'normal',
                    fontStyle: elem.fontStyle || 'normal',
                    textDecoration: elem.textDecoration || 'none',
                    color: elem.color || '#000000'
                  }}
                >
                  {elem.text}
                </div>
              )}
              {elem.type === 'image' && (
                <img src={elem.src} alt="" className="w-full h-full object-cover border-2 border-purple-500" />
              )}
              
              {selected === elem.id && (
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary cursor-se-resize" />
              )}
            </div>
          ))}

          {drawing && (
            <div
              className="absolute border-2 border-dashed border-muted-foreground"
              style={{
                left: Math.min(drawing.start.x, drawing.current.x),
                top: Math.min(drawing.start.y, drawing.current.y),
                width: Math.abs(drawing.current.x - drawing.start.x),
                height: Math.abs(drawing.current.y - drawing.start.y),
                borderRadius: tool === 'circle' ? '50%' : '0'
              }}
            />
          )}
        </div>

        {selectedElement && (
          <div className="w-64 bg-card border-l border-border p-4 overflow-y-auto">
            <h3 className="font-bold text-lg mb-4">Propriedades</h3>
            
            {selectedElement.type === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tamanho da Fonte</label>
                  <input
                    type="range"
                    min="8"
                    max="72"
                    value={selectedElement.fontSize || 16}
                    onChange={(e) => updateSelectedElement({ fontSize: parseInt(e.target.value) })}
                    className="w-full"
                  />
                  <span className="text-sm text-muted-foreground">{selectedElement.fontSize || 16}px</span>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Estilo</label>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleTextStyle('bold')}
                      className={`p-2 rounded border ${selectedElement.fontWeight === 'bold' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    >
                      <Bold size={16} />
                    </button>
                    <button
                      onClick={() => toggleTextStyle('italic')}
                      className={`p-2 rounded border ${selectedElement.fontStyle === 'italic' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    >
                      <Italic size={16} />
                    </button>
                    <button
                      onClick={() => toggleTextStyle('underline')}
                      className={`p-2 rounded border ${selectedElement.textDecoration === 'underline' ? 'bg-primary text-primary-foreground' : 'bg-muted'}`}
                    >
                      <Underline size={16} />
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Cor do Texto</label>
                  <input
                    type="color"
                    value={selectedElement.color || '#000000'}
                    onChange={(e) => updateSelectedElement({ color: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}

            {(selectedElement.type === 'rectangle' || selectedElement.type === 'circle') && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Cor da Forma</label>
                  <input
                    type="color"
                    value={selectedElement.color || '#3b82f6'}
                    onChange={(e) => updateSelectedElement({ color: e.target.value })}
                    className="w-full h-10 rounded cursor-pointer"
                  />
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {showImageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Adicionar Imagem</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Upload de arquivo</label>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full p-2 bg-primary text-primary-foreground rounded flex items-center justify-center gap-2 hover:bg-primary/90"
                >
                  <Upload size={20} /> Escolher arquivo
                </button>
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-card text-muted-foreground">OU</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">URL da imagem</label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://exemplo.com/imagem.jpg"
                  className="w-full p-2 border rounded bg-background"
                  onKeyPress={(e) => e.key === 'Enter' && handleImageUrl()}
                />
                <button
                  onClick={handleImageUrl}
                  className="w-full mt-2 p-2 bg-primary text-primary-foreground rounded flex items-center justify-center gap-2 hover:bg-primary/90"
                >
                  <Link2 size={20} /> Adicionar URL
                </button>
              </div>
            </div>

            <button
              onClick={() => {
                setShowImageModal(false);
                setImageUrl('');
              }}
              className="w-full mt-4 p-2 bg-muted rounded hover:bg-muted/80"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {showTextModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-card rounded-lg p-6 w-96">
            <h3 className="text-lg font-bold mb-4">Adicionar Texto</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Digite o texto</label>
                <input
                  type="text"
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Seu texto aqui..."
                  className="w-full p-2 border rounded bg-background"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddText()}
                  autoFocus
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <button
                onClick={handleAddText}
                className="flex-1 p-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Adicionar
              </button>
              <button
                onClick={() => {
                  setShowTextModal(false);
                  setTextInput('');
                  setTool('select');
                }}
                className="flex-1 p-2 bg-muted rounded hover:bg-muted/80"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}