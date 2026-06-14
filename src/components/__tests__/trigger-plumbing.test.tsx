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
} from "../sidebar.js";

function withExecutor(executor: TriggerExecutor) {
  return ({ children }: { children: React.ReactNode }) => (
    <TriggerProvider executor={executor}>{children}</TriggerProvider>
  );
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
  beforeAll(() => {
    // jsdom has no matchMedia; the sidebar's responsive hook needs it.
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
  });

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
