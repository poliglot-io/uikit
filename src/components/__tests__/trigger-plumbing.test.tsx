/**
 * @vitest-environment jsdom
 *
 * Proves trigger support is shared across interactive primitives rather than
 * special-cased to one. Each clickable routes its `onClick` through the same
 * helper, so a `SparqlTrigger` reaches the injected executor and a normal
 * handler still fires unchanged.
 */
import * as React from "react";
import { describe, it, expect, vi, beforeAll } from "vitest";
import { render, screen, waitFor, renderHook, act } from "@testing-library/react";
import { fireEvent } from "@testing-library/dom";

import {
  handleSPARQL,
  useResolvedClick,
  TriggerProvider,
  type TriggerExecutor,
} from "../action.js";
import { Card } from "../card.js";
import { Toggle } from "../toggle.js";
import { Tabs, TabsList, TabsTrigger } from "../tabs.js";
import { PaginationLink } from "../pagination.js";
import {
  Sidebar,
  SidebarProvider,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarMenuSub,
  SidebarMenuSubItem,
  SidebarMenuSubButton,
  SidebarTrigger,
  useSidebar,
} from "../sidebar.js";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../dropdown-menu.js";

function withExecutor(executor: TriggerExecutor) {
  return ({ children }: { children: React.ReactNode }) => (
    <TriggerProvider executor={executor}>{children}</TriggerProvider>
  );
}

// jsdom has no matchMedia; the sidebar's responsive hook needs it. Install it
// once for every suite in this file that renders sidebar primitives.
function installMatchMedia() {
  window.matchMedia = vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    addListener: vi.fn(),
    removeListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }));
}

describe("useResolvedClick", () => {
  it("passes a normal handler through unchanged", () => {
    const fn = vi.fn();
    const { result } = renderHook(() => useResolvedClick(fn));
    expect(result.current.onClick).toBe(fn);
    expect(result.current.pending).toBe(false);
  });

  it("returns undefined for an undefined handler", () => {
    const { result } = renderHook(() => useResolvedClick(undefined));
    expect(result.current.onClick).toBeUndefined();
    expect(result.current.pending).toBe(false);
  });

  it("returns a handler that calls the executor for a trigger", async () => {
    const executor: TriggerExecutor = vi.fn(async () => ({ success: true }));
    const trigger = handleSPARQL("select 1");
    const { result } = renderHook(() => useResolvedClick(trigger), {
      wrapper: withExecutor(executor),
    });

    expect(result.current.onClick).not.toBe(trigger);
    await act(async () => {
      result.current.onClick?.(
        {} as React.MouseEvent<Element, MouseEvent>
      );
    });
    expect(executor).toHaveBeenCalledWith(trigger);
  });

  it("is a no-op for a trigger with no executor in scope", () => {
    const { result } = renderHook(() =>
      useResolvedClick(handleSPARQL("select 1"))
    );
    expect(() =>
      result.current.onClick?.({} as React.MouseEvent<Element, MouseEvent>)
    ).not.toThrow();
  });
});

describe("Card", () => {
  it("hands a SparqlTrigger to the injected executor", async () => {
    const executor: TriggerExecutor = vi.fn(async () => ({ success: true }));
    const trigger = handleSPARQL("select ?s where { ?s ?p ?o }");
    render(
      <TriggerProvider executor={executor}>
        <Card data-testid="card" onClick={trigger}>
          tile
        </Card>
      </TriggerProvider>
    );

    fireEvent.click(screen.getByTestId("card"));
    await waitFor(() => expect(executor).toHaveBeenCalledWith(trigger));
  });

  it("calls a normal handler as before", () => {
    const onClick = vi.fn();
    render(
      <Card data-testid="card" onClick={onClick}>
        tile
      </Card>
    );
    fireEvent.click(screen.getByTestId("card"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("Toggle", () => {
  it("hands a SparqlTrigger to the injected executor", async () => {
    const executor: TriggerExecutor = vi.fn(async () => ({ success: true }));
    const trigger = handleSPARQL("select 1");
    render(
      <TriggerProvider executor={executor}>
        <Toggle onClick={trigger}>B</Toggle>
      </TriggerProvider>
    );

    fireEvent.click(screen.getByRole("button"));
    await waitFor(() => expect(executor).toHaveBeenCalledWith(trigger));
  });

  it("calls a normal handler as before", () => {
    const onClick = vi.fn();
    render(<Toggle onClick={onClick}>B</Toggle>);
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("TabsTrigger", () => {
  it("hands a SparqlTrigger to the injected executor", async () => {
    const executor: TriggerExecutor = vi.fn(async () => ({ success: true }));
    const trigger = handleSPARQL("select 1");
    render(
      <TriggerProvider executor={executor}>
        <Tabs defaultValue="a">
          <TabsList>
            <TabsTrigger value="a" onClick={trigger}>
              Tab A
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </TriggerProvider>
    );

    fireEvent.click(screen.getByRole("tab", { name: "Tab A" }));
    await waitFor(() => expect(executor).toHaveBeenCalledWith(trigger));
  });

  it("calls a normal handler as before", () => {
    const onClick = vi.fn();
    render(
      <Tabs defaultValue="a">
        <TabsList>
          <TabsTrigger value="a" onClick={onClick}>
            Tab A
          </TabsTrigger>
        </TabsList>
      </Tabs>
    );
    fireEvent.click(screen.getByRole("tab", { name: "Tab A" }));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("PaginationLink", () => {
  it("hands a SparqlTrigger to the injected executor", async () => {
    const executor: TriggerExecutor = vi.fn(async () => ({ success: true }));
    const trigger = handleSPARQL("select 1");
    render(
      <TriggerProvider executor={executor}>
        <PaginationLink onClick={trigger}>1</PaginationLink>
      </TriggerProvider>
    );

    fireEvent.click(screen.getByText("1"));
    await waitFor(() => expect(executor).toHaveBeenCalledWith(trigger));
  });

  it("calls a normal handler as before", () => {
    const onClick = vi.fn();
    render(<PaginationLink onClick={onClick}>1</PaginationLink>);
    fireEvent.click(screen.getByText("1"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("SidebarMenuButton", () => {
  beforeAll(installMatchMedia);

  function wrap(children: React.ReactNode) {
    return (
      <SidebarProvider>
        <Sidebar>
          <SidebarMenu>
            <SidebarMenuItem>{children}</SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    );
  }

  it("hands a SparqlTrigger to the injected executor", async () => {
    const executor: TriggerExecutor = vi.fn(async () => ({ success: true }));
    const trigger = handleSPARQL("select 1");
    render(
      <TriggerProvider executor={executor}>
        {wrap(<SidebarMenuButton onClick={trigger}>Item</SidebarMenuButton>)}
      </TriggerProvider>
    );

    fireEvent.click(screen.getByText("Item"));
    await waitFor(() => expect(executor).toHaveBeenCalledWith(trigger));
  });

  it("calls a normal handler as before", () => {
    const onClick = vi.fn();
    render(wrap(<SidebarMenuButton onClick={onClick}>Item</SidebarMenuButton>));
    fireEvent.click(screen.getByText("Item"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("SidebarMenuSubButton", () => {
  beforeAll(installMatchMedia);

  function wrap(children: React.ReactNode) {
    return (
      <SidebarProvider>
        <Sidebar>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuSub>
                <SidebarMenuSubItem>{children}</SidebarMenuSubItem>
              </SidebarMenuSub>
            </SidebarMenuItem>
          </SidebarMenu>
        </Sidebar>
      </SidebarProvider>
    );
  }

  it("hands a SparqlTrigger to the injected executor", async () => {
    const executor: TriggerExecutor = vi.fn(async () => ({ success: true }));
    const trigger = handleSPARQL("select 1");
    render(
      <TriggerProvider executor={executor}>
        {wrap(
          <SidebarMenuSubButton onClick={trigger}>Sub</SidebarMenuSubButton>
        )}
      </TriggerProvider>
    );

    fireEvent.click(screen.getByText("Sub"));
    await waitFor(() => expect(executor).toHaveBeenCalledWith(trigger));
  });

  it("calls a normal handler as before", () => {
    const onClick = vi.fn();
    render(
      wrap(<SidebarMenuSubButton onClick={onClick}>Sub</SidebarMenuSubButton>)
    );
    fireEvent.click(screen.getByText("Sub"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("DropdownMenuItem", () => {
  function wrap(children: React.ReactNode) {
    // Render the menu open so the item is in the document and clickable.
    return (
      <DropdownMenu defaultOpen>
        <DropdownMenuTrigger>Open</DropdownMenuTrigger>
        <DropdownMenuContent>{children}</DropdownMenuContent>
      </DropdownMenu>
    );
  }

  it("hands a SparqlTrigger to the injected executor", async () => {
    const executor: TriggerExecutor = vi.fn(async () => ({ success: true }));
    const trigger = handleSPARQL("select 1");
    render(
      <TriggerProvider executor={executor}>
        {wrap(<DropdownMenuItem onClick={trigger}>Run</DropdownMenuItem>)}
      </TriggerProvider>
    );

    fireEvent.click(screen.getByText("Run"));
    await waitFor(() => expect(executor).toHaveBeenCalledWith(trigger));
  });

  it("calls a normal handler as before", () => {
    const onClick = vi.fn();
    render(wrap(<DropdownMenuItem onClick={onClick}>Run</DropdownMenuItem>));
    fireEvent.click(screen.getByText("Run"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });
});

describe("SidebarTrigger", () => {
  // Unlike the plain passthrough clickables, SidebarTrigger composes the
  // resolved click with `toggleSidebar()` inline, so it gets its own coverage:
  // the executor (or a normal handler) must run AND the sidebar must still
  // toggle.
  beforeAll(installMatchMedia);

  // Surfaces the live open/closed state so a click's toggle effect is
  // observable.
  function StateProbe() {
    const { open } = useSidebar();
    return <span data-testid="sidebar-open">{String(open)}</span>;
  }

  function wrap(children: React.ReactNode) {
    return (
      <SidebarProvider>
        <Sidebar>{children}</Sidebar>
        <StateProbe />
      </SidebarProvider>
    );
  }

  it("hands a SparqlTrigger to the executor and still toggles the sidebar", async () => {
    const executor: TriggerExecutor = vi.fn(async () => ({ success: true }));
    const trigger = handleSPARQL("select 1");
    render(
      <TriggerProvider executor={executor}>
        {wrap(<SidebarTrigger onClick={trigger} />)}
      </TriggerProvider>
    );

    // Starts expanded.
    expect(screen.getByTestId("sidebar-open")).toHaveTextContent("true");

    fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));

    await waitFor(() => expect(executor).toHaveBeenCalledWith(trigger));
    // The inline toggle still ran: the sidebar collapsed.
    expect(screen.getByTestId("sidebar-open")).toHaveTextContent("false");
  });

  it("calls a normal handler and still toggles the sidebar", () => {
    const onClick = vi.fn();
    render(wrap(<SidebarTrigger onClick={onClick} />));

    expect(screen.getByTestId("sidebar-open")).toHaveTextContent("true");

    fireEvent.click(screen.getByRole("button", { name: "Toggle Sidebar" }));

    expect(onClick).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId("sidebar-open")).toHaveTextContent("false");
  });
});
