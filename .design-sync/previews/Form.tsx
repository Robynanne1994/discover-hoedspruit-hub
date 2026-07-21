import {
  Form, FormField, FormItem, FormLabel, FormControl, FormDescription,
  Input, Textarea, Button,
} from "vite_react_shadcn_ts";
import { useForm } from "react-hook-form";

export const AddYourBusiness = () => {
  const form = useForm({
    defaultValues: {
      name: "Baobab Books & Coffee",
      category: "Cafe",
      about: "Independent bookshop and slow-roast coffee bar on the main road.",
    },
  });

  return (
    <div style={{ padding: 24, width: "100%", maxWidth: 460, margin: "0 auto" }}>
      <h3 style={{ margin: "0 0 4px", fontSize: 18, fontWeight: 600 }}>Add your business</h3>
      <p style={{ margin: "0 0 20px", fontSize: 14, opacity: 0.7 }}>
        List your Hoedspruit spot on the local guide.
      </p>
      <Form {...form}>
        <form style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Business name</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Mopani Farm Stall" {...field} />
                </FormControl>
                <FormDescription>This is how you'll appear in the directory.</FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <Input placeholder="Cafe, lodge, market…" {...field} />
                </FormControl>
                <FormDescription>Pick the closest fit for your listing.</FormDescription>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="about"
            render={({ field }) => (
              <FormItem>
                <FormLabel>About</FormLabel>
                <FormControl>
                  <Textarea rows={3} placeholder="Tell visitors what makes your place special." {...field} />
                </FormControl>
                <FormDescription>A short intro shown on your listing card.</FormDescription>
              </FormItem>
            )}
          />
          <Button type="button" style={{ alignSelf: "flex-start" }}>Submit listing</Button>
        </form>
      </Form>
    </div>
  );
};
