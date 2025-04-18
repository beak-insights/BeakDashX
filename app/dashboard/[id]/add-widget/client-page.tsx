'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Editor from '@monaco-editor/react';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart,
  LineChart,
  AreaChart,
  PieChart,
  Tooltip as RechartsTooltip,
  Legend,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Pie,
  Cell,
  ResponsiveContainer,
} from 'recharts';
import {
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Table,
  Database,
  LayoutDashboard,
  Play,
  Code,
  Server,
  Text,
} from 'lucide-react';
import { getRandomColor } from '@/lib/utils';

type Dataset = {
  id: number;
  name: string;
  description: string | null;
  connectionId: number | null;
  query: string | null;
  data: string | null;
  dataType: string | null;
};

type Connection = {
  id: number;
  name: string;
  type: string;
  config: any;
};

type Dashboard = {
  id: number;
  name: string;
  description: string | null;
  spaceId: number | null;
  layout: string | null;
};

type WidgetType = 'chart' | 'text';
type ChartType = 'bar' | 'line' | 'pie' | 'area';
type TableSchema = { name: string, columns: Array<{ name: string, type: string }> };

interface WidgetClientProps {
  dashboard: Dashboard;
  datasets: Dataset[];
}

export function AddWidgetClient({ dashboard, datasets }: WidgetClientProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'query' | 'table' | 'chart'>('query');
  
  // Widget metadata
  const [widgetTitle, setWidgetTitle] = useState<string>('Widget Title');
  const [widgetSubtitle, setWidgetSubtitle] = useState<string>('Widget Subtitle');
  const [widgetWidth, setWidgetWidth] = useState<string>('3');
  const [widgetHeight, setWidgetHeight] = useState<string>('medium');
  const [refreshInterval, setRefreshInterval] = useState<string>('0');
  const [textContent, setTextContent] = useState<string>('Enter your content here...');
  
  // Data source selection
  const [connections, setConnections] = useState<Connection[]>([
    { id: 1, name: 'PostgreSQL DB', type: 'postgres', config: {} },
    { id: 2, name: 'MySQL DB', type: 'mysql', config: {} },
  ]);
  const [selectedConnectionId, setSelectedConnectionId] = useState<string>('');
  const [selectedDatasetId, setSelectedDatasetId] = useState<string>('');
  const [availableSchemas, setAvailableSchemas] = useState<string[]>(['public', 'test']);
  const [selectedSchema, setSelectedSchema] = useState<string>('public');
  const [availableTables, setAvailableTables] = useState<string[]>(['users', 'products', 'orders']);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableColumns, setTableColumns] = useState<Array<{name: string, type: string}>>([]);
  
  // SQL Editor
  const [sqlQuery, setSqlQuery] = useState<string>('SELECT * FROM users LIMIT 10');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  
  // Data & visualization
  const [widgetType, setWidgetType] = useState<WidgetType>('chart');
  const [chartType, setChartType] = useState<ChartType>('bar');
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [dataFields, setDataFields] = useState<string[]>([]);
  const [xAxisField, setXAxisField] = useState<string>('');
  const [yAxisField, setYAxisField] = useState<string>('');
  
  // Chart configuration options
  const [showLegend, setShowLegend] = useState<boolean>(true);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showTooltip, setShowTooltip] = useState<boolean>(true);
  const [isStacked, setIsStacked] = useState<boolean>(false);
  const [chartColors, setChartColors] = useState<string[]>([]);
  
  useEffect(() => {
    // Generate random colors when chart type changes
    if (widgetType) {
      const colors = Array.from({ length: 10 }, (_, i) => getRandomColor(i));
      setChartColors(colors);
    }
  }, [widgetType]);

  // Handle connection selection
  useEffect(() => {
    if (selectedConnectionId) {
      // In a real app, we would fetch schemas for this connection
      // For now, just simulate the behavior
      setSelectedSchema('public');
      setAvailableTables(['users', 'products', 'orders']);
      setSelectedTable('');
    }
  }, [selectedConnectionId]);

  // Handle schema selection
  useEffect(() => {
    if (selectedSchema) {
      // In a real app, we would fetch tables for this schema
      // For now, just simulate the behavior
      if (selectedSchema === 'public') {
        setAvailableTables(['users', 'products', 'orders']);
      } else {
        setAvailableTables(['test_data', 'metrics']);
      }
      setSelectedTable('');
    }
  }, [selectedSchema]);

  // Handle table selection
  useEffect(() => {
    if (selectedTable) {
      // In a real app, we would fetch columns for this table
      // For now, just simulate the behavior
      let columns: Array<{name: string, type: string}> = [];
      
      if (selectedTable === 'users') {
        columns = [
          { name: 'id', type: 'integer' },
          { name: 'name', type: 'text' },
          { name: 'email', type: 'text' },
          { name: 'created_at', type: 'timestamp' }
        ];
        
        setSqlQuery(`SELECT id, name, email, created_at FROM ${selectedSchema}.${selectedTable} LIMIT 10`);
      } else if (selectedTable === 'products') {
        columns = [
          { name: 'id', type: 'integer' },
          { name: 'name', type: 'text' },
          { name: 'price', type: 'numeric' },
          { name: 'category', type: 'text' },
          { name: 'in_stock', type: 'boolean' }
        ];
        
        setSqlQuery(`SELECT id, name, price, category FROM ${selectedSchema}.${selectedTable} LIMIT 10`);
      } else if (selectedTable === 'orders') {
        columns = [
          { name: 'id', type: 'integer' },
          { name: 'user_id', type: 'integer' },
          { name: 'total', type: 'numeric' },
          { name: 'status', type: 'text' },
          { name: 'order_date', type: 'timestamp' }
        ];
        
        setSqlQuery(`SELECT id, user_id, total, status, order_date FROM ${selectedSchema}.${selectedTable} LIMIT 10`);
      }
      
      setTableColumns(columns);
    }
  }, [selectedTable, selectedSchema]);

  // Simulate loading dataset data when selected
  useEffect(() => {
    if (selectedDatasetId) {
      const selectedDataset = datasets.find(d => d.id.toString() === selectedDatasetId);
      
      if (selectedDataset?.data) {
        try {
          // Parse the JSON data from the dataset
          const parsedData = JSON.parse(selectedDataset.data);
          
          if (Array.isArray(parsedData) && parsedData.length > 0) {
            setPreviewData(parsedData.slice(0, 20)); // Limit to 20 rows for preview
            
            // Extract field names from the first object
            if (parsedData[0]) {
              const fields = Object.keys(parsedData[0]);
              setDataFields(fields);
              
              // Set default x and y axis fields if available
              if (fields.length > 0) {
                setXAxisField(fields[0]);
                if (fields.length > 1) {
                  setYAxisField(fields[1]);
                } else {
                  setYAxisField(fields[0]);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error parsing dataset data:', error);
          setPreviewData([]);
          setDataFields([]);
        }
      } else if (selectedDataset?.query) {
        // If dataset has SQL query, use it
        setSqlQuery(selectedDataset.query);
      }
    }
  }, [selectedDatasetId, datasets]);

  // Generate sample data for preview
  const generateSampleData = () => {
    const sampleData = Array.from({ length: 7 }, (_, i) => ({
      name: `Day ${i + 1}`,
      value: Math.floor(Math.random() * 1000),
      value2: Math.floor(Math.random() * 800),
      value3: Math.floor(Math.random() * 600),
    }));
    
    setPreviewData(sampleData);
    setDataFields(['name', 'value', 'value2', 'value3']);
    setXAxisField('name');
    setYAxisField('value');
  };

  // Process SQL query
  const processQuery = () => {
    setIsProcessing(true);
    
    // In a real implementation, this would send the SQL query to the server
    // For now, we'll just generate some sample data
    setTimeout(() => {
      generateSampleData();
      setIsProcessing(false);
      setActiveTab('table');
    }, 1000);
  };

  // Handle widget creation
  const handleCreateWidget = async () => {
    try {
      // Prepare widget data based on type
      const widgetData = {
        name: widgetTitle,
        spaceId: dashboard.spaceId,
        type: widgetType,
        dashboardId: dashboard.id,
        position: {
          x: 0,
          y: 0,
          w: widgetWidth === '1' ? 4 : widgetWidth === '2' ? 8 : 12,
          h: 4
        }
      };
      
      // Add config data based on widget type
      if (widgetType === 'text') {
        widgetData.config = {
          textContent,
          textAlign: 'left',
          fontSize: 'medium',
          fontWeight: 'normal',
          textColor: '',
          backgroundColor: '',
        };
      } else {
        // For chart widgets
        widgetData.datasetId = selectedDatasetId ? parseInt(selectedDatasetId) : null;
        widgetData.connectionId = selectedConnectionId ? parseInt(selectedConnectionId) : null;
        widgetData.customQuery = sqlQuery;
        widgetData.config = {
          chartType,
          xAxis: xAxisField,
          yAxis: yAxisField,
          showLegend,
          showGrid,
          showTooltip,
          isStacked,
          colors: chartColors,
          refreshInterval: refreshInterval ? parseInt(refreshInterval) : 0,
        };
      }
      
      // Send the widget data to the server
      const response = await fetch(`/api/dashboards/${dashboard.id}/widgets`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(widgetData),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create widget');
      }
      
      // Navigate back to the dashboard view
      router.push(`/dashboard/${dashboard.id}`);
    } catch (error) {
      console.error('Error creating widget:', error);
      alert('Failed to create widget: ' + (error.message || 'Unknown error'));
    }
  };

  const renderTableColumns = () => {
    return (
      <div className="border rounded-lg bg-card p-4 max-h-72 overflow-y-auto">
        <h4 className="text-sm font-medium mb-2">Available Columns</h4>
        <div className="grid grid-cols-2 gap-2">
          <div className="font-medium text-sm px-3 py-2 bg-muted rounded-md">Column</div>
          <div className="font-medium text-sm px-3 py-2 bg-muted rounded-md">Type</div>
          
          {tableColumns.map((column, index) => (
            <React.Fragment key={index}>
              <div className="text-sm px-3 py-2">{column.name}</div>
              <div className="text-sm px-3 py-2 text-muted-foreground">{column.type}</div>
            </React.Fragment>
          ))}
        </div>
      </div>
    );
  };

  const renderDataSourceFields = () => {
    return (
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-sm font-medium">Dataset</label>
          
          {datasets.length > 0 ? (
            <Select 
              value={selectedDatasetId} 
              onValueChange={setSelectedDatasetId}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a dataset" />
              </SelectTrigger>
              <SelectContent>
                {datasets.map((dataset) => (
                  <SelectItem key={dataset.id} value={dataset.id.toString()}>
                    {dataset.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <div className="text-sm text-muted-foreground">
              No datasets available
            </div>
          )}
        </div>
        
        <div className="space-y-2">
          <div className="text-sm font-medium">Database Connection</div>
          
          <Select 
            value={selectedConnectionId} 
            onValueChange={setSelectedConnectionId}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select connection" />
            </SelectTrigger>
            <SelectContent>
              {connections.map((connection) => (
                <SelectItem key={connection.id} value={connection.id.toString()}>
                  {connection.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        {selectedConnectionId && (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium">Schema</label>
              <Select 
                value={selectedSchema} 
                onValueChange={setSelectedSchema}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select schema" />
                </SelectTrigger>
                <SelectContent>
                  {availableSchemas.map((schema) => (
                    <SelectItem key={schema} value={schema}>
                      {schema}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {selectedSchema && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Table</label>
                <Select 
                  value={selectedTable} 
                  onValueChange={setSelectedTable}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select table" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTables.map((table) => (
                      <SelectItem key={table} value={table}>
                        {table}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            {selectedTable && renderTableColumns()}
          </>
        )}
      </div>
    );
  };

  const renderChartDataMapping = () => {
    return (
      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-medium mb-2">Data Mapping</h4>
        
        {['bar', 'line', 'area'].includes(chartType) && (
          <>
            <div className="space-y-2">
              <label 
                htmlFor="xAxis" 
                className="text-xs font-medium"
              >
                X-Axis
              </label>
              <Select value={xAxisField} onValueChange={setXAxisField}>
                <SelectTrigger id="xAxis" className="h-8 text-xs">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {dataFields.map((field) => (
                    <SelectItem key={field} value={field} className="text-xs">
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label 
                htmlFor="yAxis" 
                className="text-xs font-medium"
              >
                Y-Axis
              </label>
              <Select value={yAxisField} onValueChange={setYAxisField}>
                <SelectTrigger id="yAxis" className="h-8 text-xs">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {dataFields.map((field) => (
                    <SelectItem key={field} value={field} className="text-xs">
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        
        {chartType === 'pie' && (
          <>
            <div className="space-y-2">
              <label 
                htmlFor="labelField" 
                className="text-xs font-medium"
              >
                Label
              </label>
              <Select value={xAxisField} onValueChange={setXAxisField}>
                <SelectTrigger id="labelField" className="h-8 text-xs">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {dataFields.map((field) => (
                    <SelectItem key={field} value={field} className="text-xs">
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label 
                htmlFor="valueField" 
                className="text-xs font-medium"
              >
                Value
              </label>
              <Select value={yAxisField} onValueChange={setYAxisField}>
                <SelectTrigger id="valueField" className="h-8 text-xs">
                  <SelectValue placeholder="Select field" />
                </SelectTrigger>
                <SelectContent>
                  {dataFields.map((field) => (
                    <SelectItem key={field} value={field} className="text-xs">
                      {field}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>
    );
  };

  const renderChartAppearance = () => {
    return (
      <div className="border rounded-lg p-4 space-y-3">
        <h4 className="text-sm font-medium mb-2">Appearance</h4>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showLegend"
            checked={showLegend}
            onChange={(e) => setShowLegend(e.target.checked)}
            className="h-4 w-4"
          />
          <label 
            htmlFor="showLegend"
            className="text-xs"
          >
            Show Legend
          </label>
        </div>
        
        <div className="flex items-center space-x-2">
          <input
            type="checkbox"
            id="showTooltip"
            checked={showTooltip}
            onChange={(e) => setShowTooltip(e.target.checked)}
            className="h-4 w-4"
          />
          <label 
            htmlFor="showTooltip"
            className="text-xs"
          >
            Show Tooltip
          </label>
        </div>
        
        {['bar', 'line', 'area'].includes(chartType) && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="showGrid"
              checked={showGrid}
              onChange={(e) => setShowGrid(e.target.checked)}
              className="h-4 w-4"
            />
            <label 
              htmlFor="showGrid"
              className="text-xs"
            >
              Show Grid
            </label>
          </div>
        )}
        
        {['bar', 'area'].includes(chartType) && (
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="stacked"
              checked={isStacked}
              onChange={(e) => setIsStacked(e.target.checked)}
              className="h-4 w-4"
            />
            <label 
              htmlFor="stacked"
              className="text-xs"
            >
              Stacked
            </label>
          </div>
        )}
      </div>
    );
  };

  const renderBarChart = () => {
    if (!previewData.length || !xAxisField || !yAxisField) return null;
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={previewData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xAxisField} />
          <YAxis />
          {showTooltip && <RechartsTooltip />}
          {showLegend && <Legend />}
          
          {dataFields
            .filter(field => field !== xAxisField && !['id', '_id'].includes(field))
            .map((field, index) => (
              <Bar 
                key={field} 
                dataKey={field} 
                fill={chartColors[index % chartColors.length]} 
                stackId={isStacked ? 'stack' : undefined}
              />
            ))}
        </BarChart>
      </ResponsiveContainer>
    );
  };

  const renderLineChart = () => {
    if (!previewData.length || !xAxisField || !yAxisField) return null;
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={previewData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xAxisField} />
          <YAxis />
          {showTooltip && <RechartsTooltip />}
          {showLegend && <Legend />}
          
          {dataFields
            .filter(field => field !== xAxisField && !['id', '_id'].includes(field))
            .map((field, index) => (
              <Line 
                key={field} 
                type="monotone" 
                dataKey={field} 
                stroke={chartColors[index % chartColors.length]} 
                activeDot={{ r: 8 }}
              />
            ))}
        </LineChart>
      </ResponsiveContainer>
    );
  };

  const renderAreaChart = () => {
    if (!previewData.length || !xAxisField || !yAxisField) return null;
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={previewData}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" />}
          <XAxis dataKey={xAxisField} />
          <YAxis />
          {showTooltip && <RechartsTooltip />}
          {showLegend && <Legend />}
          
          {dataFields
            .filter(field => field !== xAxisField && !['id', '_id'].includes(field))
            .map((field, index) => (
              <Area 
                key={field} 
                type="monotone" 
                dataKey={field} 
                fill={chartColors[index % chartColors.length]} 
                stroke={chartColors[index % chartColors.length]} 
                stackId={isStacked ? 'stack' : undefined}
              />
            ))}
        </AreaChart>
      </ResponsiveContainer>
    );
  };

  const renderPieChart = () => {
    if (!previewData.length || !xAxisField || !yAxisField) return null;
    
    // For pie chart, we need to format data differently
    // We'll show a pie per data point using the y-axis field as value
    
    return (
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={previewData}
            cx="50%"
            cy="50%"
            labelLine={true}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
            outerRadius={100}
            fill="#8884d8"
            dataKey={yAxisField}
            nameKey={xAxisField}
          >
            {previewData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={chartColors[index % chartColors.length]} />
            ))}
          </Pie>
          {showTooltip && <RechartsTooltip />}
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    );
  };

  const renderChart = () => {
    switch(chartType) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'area':
        return renderAreaChart();
      case 'pie':
        return renderPieChart();
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Create New Widget</h1>
          <p className="text-muted-foreground mt-1">
            Dashboard: {dashboard.name}
          </p>
        </div>
        
        <Link
          href={`/dashboard/${dashboard.id}`}
          className="bg-secondary text-secondary-foreground hover:bg-secondary/80 px-4 py-2 rounded-md text-sm font-medium"
        >
          Cancel
        </Link>
      </div>
      
      <div className="grid grid-cols-12 gap-6 mb-6">
        {/* Left sidebar - config */}
        <div className="col-span-4 space-y-4">
          
          {/* Widget Type Selection */}
          <div className="border rounded-lg p-4 bg-card">
            <h2 className="text-lg font-medium mb-4">Widget Type</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div 
                className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors ${widgetType === 'chart' ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => setWidgetType('chart')}
              >
                <BarChart3 className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">Chart</span>
                <span className="text-xs text-muted-foreground mt-1">Data visualization</span>
              </div>
              
              <div 
                className={`border rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors ${widgetType === 'text' ? 'border-primary bg-primary/5' : ''}`}
                onClick={() => setWidgetType('text')}
              >
                <Text className="h-8 w-8 mb-2" />
                <span className="text-sm font-medium">Text</span>
                <span className="text-xs text-muted-foreground mt-1">Rich text content</span>
              </div>
            </div>
          </div>
          
          {/* Chart Type Selection - only shown for chart widget type */}
          {widgetType === 'chart' && (
            <div className="border rounded-lg p-4 bg-card">
              <h2 className="text-lg font-medium mb-4">Chart Type</h2>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div 
                  className={`border rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors ${chartType === 'bar' ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => setChartType('bar')}
                >
                  <BarChart3 className="h-6 w-6 mb-2" />
                  <span className="text-sm">Bar</span>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors ${chartType === 'line' ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => setChartType('line')}
                >
                  <LineChartIcon className="h-6 w-6 mb-2" />
                  <span className="text-sm">Line</span>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors ${chartType === 'pie' ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => setChartType('pie')}
                >
                  <PieChartIcon className="h-6 w-6 mb-2" />
                  <span className="text-sm">Pie</span>
                </div>
                
                <div 
                  className={`border rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors ${chartType === 'area' ? 'border-primary bg-primary/5' : ''}`}
                  onClick={() => setChartType('area')}
                >
                  <LayoutDashboard className="h-6 w-6 mb-2" />
                  <span className="text-sm">Area</span>
                </div>
              </div>
            </div>
          )}
          
          {/* Text content editor (only shown for text widget type) */}
          {widgetType === 'text' && (
            <div className="border rounded-lg p-4 bg-card">
              <h2 className="text-lg font-medium mb-4">Text Content</h2>
              
              <div className="space-y-4">
                <textarea
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[200px]"
                  placeholder="Enter your content here..."
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                />
              </div>
            </div>
          )}
          
          {/* Data source section (hidden for text widget type) */}
          {widgetType !== 'text' && (
            <div className="border rounded-lg p-4 bg-card">
              <h2 className="text-lg font-medium mb-4">Data Source</h2>
              {renderDataSourceFields()}
            </div>
          )}
        </div>
        
        {/* Main content area */}
        <div className="col-span-8 space-y-4">
          {/* Widget Details - Moved to top right */}
          <div className="border rounded-lg p-4 bg-card">
            <h2 className="text-lg font-medium mb-4">Widget Details</h2>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label 
                  htmlFor="title-right" 
                  className="text-sm font-medium"
                >
                  Title
                </label>
                <input
                  id="title-right"
                  type="text"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={widgetTitle}
                  onChange={(e) => setWidgetTitle(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label 
                  htmlFor="subtitle-right" 
                  className="text-sm font-medium"
                >
                  Subtitle
                </label>
                <input
                  id="subtitle-right"
                  type="text"
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  value={widgetSubtitle}
                  onChange={(e) => setWidgetSubtitle(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="border rounded-lg overflow-hidden h-[500px] flex flex-col">
            {widgetType === 'text' ? (
              <div className="p-4 h-full">
                <h2 className="text-lg font-medium mb-4">Text Widget Preview</h2>
                <div className="border rounded-lg p-4 bg-card h-[calc(100%-3rem)] overflow-auto">
                  <div className="prose max-w-none">
                    <h3>{widgetTitle}</h3>
                    <p className="text-sm text-muted-foreground">{widgetSubtitle}</p>
                    <div className="mt-4">
                      {textContent.split('\n').map((line, i) => (
                        <p key={i}>{line || <br />}</p>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)} className="flex-1 flex flex-col">
                <div className="border-b">
                  <TabsList className="w-full bg-transparent justify-start rounded-none h-12 px-4">
                    <TabsTrigger value="query" className="data-[state=active]:bg-muted rounded-none">
                      <Code className="h-4 w-4 mr-2" />
                      Query View
                    </TabsTrigger>
                    <TabsTrigger value="table" className="data-[state=active]:bg-muted rounded-none">
                      <Table className="h-4 w-4 mr-2" />
                      Table View
                    </TabsTrigger>
                    <TabsTrigger value="chart" className="data-[state=active]:bg-muted rounded-none">
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Chart Preview
                    </TabsTrigger>
                  </TabsList>
                </div>
                
                <TabsContent value="query" className="flex-1 p-0 m-0 flex flex-col">
                  <div className="p-4 pb-2 text-sm font-medium">SQL Query</div>
                  <div className="flex-1 relative">
                    <Editor
                      height="100%"
                      defaultLanguage="sql"
                      value={sqlQuery}
                      onChange={(value) => setSqlQuery(value || "")}
                      options={{
                        minimap: { enabled: false },
                        scrollBeyondLastLine: false,
                        fontSize: 14,
                      }}
                      theme="vs-dark"
                    />
                    
                    <div className="absolute right-3 bottom-3">
                      <button
                        onClick={processQuery}
                        className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
                        disabled={isProcessing}
                      >
                        {isProcessing ? 'Executing...' : 'Execute'}
                      </button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="table" className="flex-1 p-4 m-0 overflow-auto">
                  {previewData.length > 0 ? (
                    <div className="border rounded-lg overflow-hidden">
                      <table className="min-w-full divide-y divide-border">
                        <thead className="bg-muted">
                          <tr>
                            {dataFields.map((field) => (
                              <th
                                key={field}
                                className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                              >
                                {field}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="bg-card divide-y divide-border">
                          {previewData.map((row, i) => (
                            <tr key={i} className={i % 2 === 0 ? 'bg-background' : ''}>
                              {dataFields.map((field) => (
                                <td
                                  key={field}
                                  className="px-4 py-3 whitespace-nowrap text-sm"
                                >
                                  {row[field]?.toString() || 'null'}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Server className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No data available</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Run a query to see data preview
                        </p>
                        <button
                          onClick={processQuery}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Execute Query
                        </button>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="chart" className="flex-1 p-4 m-0 overflow-auto">
                  {previewData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
                      {/* Chart configuration */}
                      <div className="col-span-2 space-y-4">
                        <div className="border rounded-lg p-4 space-y-3">
                          <h4 className="text-sm font-medium mb-2">Chart Type</h4>
                          <div className="grid grid-cols-2 gap-2">
                            <div 
                              className={`border rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors ${chartType === 'bar' ? 'border-primary bg-primary/5' : ''}`}
                              onClick={() => setChartType('bar')}
                            >
                              <BarChart3 className="h-5 w-5" />
                              <span className="text-xs mt-1">Bar</span>
                            </div>
                            
                            <div 
                              className={`border rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors ${chartType === 'line' ? 'border-primary bg-primary/5' : ''}`}
                              onClick={() => setChartType('line')}
                            >
                              <LineChartIcon className="h-5 w-5" />
                              <span className="text-xs mt-1">Line</span>
                            </div>
                            
                            <div 
                              className={`border rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors ${chartType === 'pie' ? 'border-primary bg-primary/5' : ''}`}
                              onClick={() => setChartType('pie')}
                            >
                              <PieChartIcon className="h-5 w-5" />
                              <span className="text-xs mt-1">Pie</span>
                            </div>
                            
                            <div 
                              className={`border rounded-lg p-2 flex flex-col items-center justify-center cursor-pointer hover:bg-muted transition-colors ${chartType === 'area' ? 'border-primary bg-primary/5' : ''}`}
                              onClick={() => setChartType('area')}
                            >
                              <LayoutDashboard className="h-5 w-5" />
                              <span className="text-xs mt-1">Area</span>
                            </div>
                          </div>
                        </div>
                        
                        {renderChartDataMapping()}
                        {renderChartAppearance()}
                      </div>
                      
                      {/* Chart preview */}
                      <div className="col-span-4 border rounded-lg p-4 bg-card">
                        <div className="text-sm font-medium mb-2">{widgetTitle}</div>
                        <div className="text-xs text-muted-foreground mb-4">{widgetSubtitle}</div>
                        
                        <div className="h-[300px] flex items-center justify-center">
                          {renderChart()}
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-medium mb-2">No data available</h3>
                        <p className="text-sm text-muted-foreground mb-4">
                          Run a query to see chart preview
                        </p>
                        <button
                          onClick={processQuery}
                          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
                        >
                          Execute Query
                        </button>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            )}
          </div>
        </div>
      </div>
      
      {/* Footer actions */}
      <div className="flex justify-end space-x-4 border-t border-border p-4 mt-6">
        <Select 
          value={widgetWidth} 
          onValueChange={setWidgetWidth}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Widget width" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">Small (1/3)</SelectItem>
            <SelectItem value="2">Medium (2/3)</SelectItem>
            <SelectItem value="3">Full (3/3)</SelectItem>
          </SelectContent>
        </Select>
        
        <Select 
          value={refreshInterval} 
          onValueChange={setRefreshInterval}
        >
          <SelectTrigger className="w-[150px]">
            <SelectValue placeholder="Auto refresh" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="0">No auto refresh</SelectItem>
            <SelectItem value="30">Every 30 seconds</SelectItem>
            <SelectItem value="60">Every minute</SelectItem>
            <SelectItem value="300">Every 5 minutes</SelectItem>
            <SelectItem value="3600">Every hour</SelectItem>
          </SelectContent>
        </Select>
        
        <button
          onClick={handleCreateWidget}
          className="bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 rounded-md text-sm font-medium"
        >
          Create Widget
        </button>
      </div>
    </div>
  );
}