import type { Meta, StoryObj } from "@storybook/react-vite";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "./form";
import { Input } from "./input";
import { Button } from "./button";

const meta = {
  title: "UI Kit/Form",
  component: Form,
  tags: ["autodocs"],
} satisfies Meta<typeof Form>;

export default meta;
type Story = StoryObj<typeof meta>;

type ExampleValues = {
  username: string;
  email: string;
};

function ExampleForm() {
  const form = useForm<ExampleValues>({
    defaultValues: { username: "", email: "" },
  });

  const onSubmit = (values: ExampleValues) => {
    // eslint-disable-next-line no-console
    console.log("submitted", values);
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full max-w-sm space-y-6"
      >
        <FormField
          control={form.control}
          name="username"
          rules={{ required: "A username is required." }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="jane" {...field} />
              </FormControl>
              <FormDescription>This is your public display name.</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="email"
          rules={{ required: "An email is required." }}
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jane@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit">Submit</Button>
      </form>
    </Form>
  );
}

export const Default: Story = {
  render: () => <ExampleForm />,
};
