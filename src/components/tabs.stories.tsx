import type { Meta, StoryObj } from "@storybook/react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./tabs";

const meta = {
  title: "UI Kit/Tabs",
  component: Tabs,
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="account" className="w-80">
      <TabsList>
        <TabsTrigger value="account">Account</TabsTrigger>
        <TabsTrigger value="password">Password</TabsTrigger>
      </TabsList>
      <TabsContent value="account" className="text-sm text-muted-foreground">
        Update your account details and preferences here.
      </TabsContent>
      <TabsContent value="password" className="text-sm text-muted-foreground">
        Change your password and manage security settings.
      </TabsContent>
    </Tabs>
  ),
};

export const ThreeTabs: Story = {
  render: () => (
    <Tabs defaultValue="overview" className="w-96">
      <TabsList>
        <TabsTrigger value="overview">Overview</TabsTrigger>
        <TabsTrigger value="activity">Activity</TabsTrigger>
        <TabsTrigger value="settings">Settings</TabsTrigger>
      </TabsList>
      <TabsContent value="overview" className="text-sm text-muted-foreground">
        A summary of the most important information.
      </TabsContent>
      <TabsContent value="activity" className="text-sm text-muted-foreground">
        A timeline of recent events.
      </TabsContent>
      <TabsContent value="settings" className="text-sm text-muted-foreground">
        Configure how this section behaves.
      </TabsContent>
    </Tabs>
  ),
};

export const DisabledTab: Story = {
  render: () => (
    <Tabs defaultValue="general" className="w-80">
      <TabsList>
        <TabsTrigger value="general">General</TabsTrigger>
        <TabsTrigger value="advanced" disabled>
          Advanced
        </TabsTrigger>
      </TabsList>
      <TabsContent value="general" className="text-sm text-muted-foreground">
        Common options available to everyone.
      </TabsContent>
      <TabsContent value="advanced" className="text-sm text-muted-foreground">
        Advanced options are currently unavailable.
      </TabsContent>
    </Tabs>
  ),
};
