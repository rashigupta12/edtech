/*eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";

interface EnhancedDynamicListProps {
  title: string;
  items: string[] | { title: string; description: string }[] | { feature: string }[] | { content: string }[] | { topic: string }[];
  setItems: (items: any[]) => void;
  placeholder?: string;
  type?: "simple" | "whyLearn" | "feature" | "content" | "topic";
}

export function EnhancedDynamicList({
  title,
  items,
  setItems,
  placeholder = "Enter item...",
  type = "simple"
}: EnhancedDynamicListProps) {
  const [localItems, setLocalItems] = useState(() => 
    items.length > 0 ? items : getDefaultItem()
  );

  function getDefaultItem() {
    switch (type) {
      case "whyLearn":
        return [{ title: "", description: "" }];
      case "feature":
        return [{ feature: "" }];
      case "content":
        return [{ content: "" }];
      case "topic":
        return [{ topic: "" }];
      default:
        return [""];
    }
  }

  const updateLocalItems = (newItems: any[]) => {
    setLocalItems(newItems);
    setItems(newItems);
  };

  const addItem = () => {
    let newItem: any;
    switch (type) {
      case "whyLearn":
        newItem = { title: "", description: "" };
        break;
      case "feature":
        newItem = { feature: "" };
        break;
      case "content":
        newItem = { content: "" };
        break;
      case "topic":
        newItem = { topic: "" };
        break;
      default:
        newItem = "";
    }
    updateLocalItems([...localItems, newItem]);
  };

  const removeItem = (index: number) => {
    const newItems = localItems.filter((_, i) => i !== index);
    updateLocalItems(newItems.length > 0 ? newItems : getDefaultItem());
  };

  const updateItem = (index: number, value: any) => {
    const newItems = [...localItems];
    newItems[index] = value;
    updateLocalItems(newItems);
  };

  const getValue = (item: any, field: string) => {
    if (typeof item === 'string') return item;
    return item[field] || '';
  };

  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-blue-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-gray-900">{title}</CardTitle>
          <Button
            type="button"
            onClick={addItem}
            size="sm"
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-4">
          {localItems.map((item, index) => (
            <div key={index} className="flex gap-3 items-start group">
              <div className="flex-1 space-y-3">
                {type === "whyLearn" ? (
                  <>
                    <Input
                      value={getValue(item, 'title')}
                      onChange={(e) => updateItem(index, { 
                        ...(item as any), 
                        title: e.target.value 
                      })}
                      placeholder="Title"
                      className="w-full"
                    />
                    <Textarea
                      value={getValue(item, 'description')}
                      onChange={(e) => updateItem(index, { 
                        ...(item as any), 
                        description: e.target.value 
                      })}
                      placeholder="Description"
                      rows={3}
                      className="w-full resize-none"
                    />
                  </>
                ) : (
                  <Input
                    value={getValue(item, 
                      type === 'feature' ? 'feature' : 
                      type === 'content' ? 'content' : 
                      type === 'topic' ? 'topic' : ''
                    )}
                    onChange={(e) => {
                      if (type === 'simple') {
                        updateItem(index, e.target.value);
                      } else {
                        updateItem(index, { 
                          ...(item as any), 
                          [type === 'feature' ? 'feature' : 
                           type === 'content' ? 'content' : 
                           'topic']: e.target.value 
                        });
                      }
                    }}
                    placeholder={placeholder}
                    className="w-full"
                  />
                )}
              </div>
              
              {localItems.length > 1 && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeItem(index)}
                  className="opacity-0 group-hover:opacity-100 transition-opacity mt-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}