import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

interface WhyLearnItem {
  title: string;
  description: string;
}

interface DynamicWhyLearnProps {
  items: WhyLearnItem[];
  setItems: (items: WhyLearnItem[]) => void;
}

export default function DynamicWhyLearn({ items, setItems }: DynamicWhyLearnProps) {
  const addItem = () => {
    setItems([...items, { title: "", description: "" }]);
  };

  const updateItem = (index: number, field: keyof WhyLearnItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const removeItem = (index: number) => {
    const newItems = items.filter((_, i) => i !== index);
    setItems(newItems.length > 0 ? newItems : [{ title: "", description: "" }]);
  };

  return (
    <Card className="border border-gray-200 hover:shadow-md transition-shadow">
      <CardHeader className="bg-gradient-to-r from-amber-50 to-amber-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl text-gray-900">Why Learn This Course</CardTitle>
          <Button
            type="button"
            onClick={addItem}
            size="sm"
            className="bg-amber-600 hover:bg-amber-700 text-white"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Reason
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={index} className="space-y-3 p-4 border border-amber-200 rounded-lg bg-amber-50 group">
              <div className="flex gap-3 items-start">
                <div className="flex-1 space-y-3">
                  <Input
                    value={item.title}
                    onChange={(e) => updateItem(index, "title", e.target.value)}
                    placeholder="Title (e.g., Expert Guidance)"
                    className="w-full"
                  />
                  <Textarea
                    value={item.description}
                    onChange={(e) => updateItem(index, "description", e.target.value)}
                    placeholder="Description (e.g., Learn from industry experts with years of experience...)"
                    rows={3}
                    className="w-full resize-none"
                  />
                </div>
                {items.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(index)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 mt-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}