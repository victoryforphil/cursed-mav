import React from 'react';

export const DataPanel: React.FC = () => {
  const sampleData = [
    { label: 'Users', value: 1234, change: '+12%' },
    { label: 'Revenue', value: '$45,678', change: '+8%' },
    { label: 'Orders', value: 567, change: '+15%' },
    { label: 'Conversion', value: '3.4%', change: '+2%' },
  ];

  return (
    <div className="h-full p-6 bg-background">
      <h2 className="text-xl font-semibold mb-6 text-foreground">Data Overview</h2>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        {sampleData.map((item, index) => (
          <div key={index} className="p-4 border rounded-lg bg-card">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm text-muted-foreground">{item.label}</p>
                <p className="text-2xl font-bold text-card-foreground">{item.value}</p>
              </div>
              <span className="text-sm text-green-600 bg-green-50 px-2 py-1 rounded">
                {item.change}
              </span>
            </div>
          </div>
        ))}
      </div>
      
      <div className="p-4 border rounded-lg bg-card">
        <h3 className="font-semibold mb-4 text-card-foreground">Chart Placeholder</h3>
        <div className="h-32 bg-muted rounded flex items-center justify-center">
          <p className="text-muted-foreground">Data visualization would go here</p>
        </div>
      </div>
    </div>
  );
}; 