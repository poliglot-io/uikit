/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardAction,
  CardDescription,
  CardContent,
} from "../card.js";

describe("Card", () => {
  it("renders children", () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText("Card content")).toBeInTheDocument();
  });

  it("applies data-slot attribute", () => {
    render(<Card data-testid="card">Content</Card>);
    expect(screen.getByTestId("card")).toHaveAttribute("data-slot", "card");
  });

  it("applies base classes", () => {
    render(<Card data-testid="card">Content</Card>);
    const card = screen.getByTestId("card");
    expect(card.className).toContain("bg-card");
    expect(card.className).toContain("rounded-xl");
    expect(card.className).toContain("border");
  });

  it("allows custom className", () => {
    render(
      <Card className="custom-card" data-testid="card">
        Content
      </Card>
    );
    expect(screen.getByTestId("card").className).toContain("custom-card");
  });

  it("passes through HTML attributes", () => {
    render(
      <Card id="my-card" aria-label="Test card">
        Content
      </Card>
    );
    const card = screen.getByLabelText("Test card");
    expect(card).toHaveAttribute("id", "my-card");
  });
});

describe("CardHeader", () => {
  it("renders children", () => {
    render(<CardHeader>Header content</CardHeader>);
    expect(screen.getByText("Header content")).toBeInTheDocument();
  });

  it("applies data-slot attribute", () => {
    render(<CardHeader data-testid="header">Content</CardHeader>);
    expect(screen.getByTestId("header")).toHaveAttribute(
      "data-slot",
      "card-header"
    );
  });

  it("applies grid layout classes", () => {
    render(<CardHeader data-testid="header">Content</CardHeader>);
    const header = screen.getByTestId("header");
    expect(header.className).toContain("grid");
    expect(header.className).toContain("px-6");
  });

  it("allows custom className", () => {
    render(
      <CardHeader className="custom-header" data-testid="header">
        Content
      </CardHeader>
    );
    expect(screen.getByTestId("header").className).toContain("custom-header");
  });
});

describe("CardTitle", () => {
  it("renders children", () => {
    render(<CardTitle>My Title</CardTitle>);
    expect(screen.getByText("My Title")).toBeInTheDocument();
  });

  it("applies data-slot attribute", () => {
    render(<CardTitle data-testid="title">Title</CardTitle>);
    expect(screen.getByTestId("title")).toHaveAttribute(
      "data-slot",
      "card-title"
    );
  });

  it("applies typography classes", () => {
    render(<CardTitle data-testid="title">Title</CardTitle>);
    const title = screen.getByTestId("title");
    expect(title.className).toContain("font-semibold");
  });

  it("allows custom className", () => {
    render(
      <CardTitle className="custom-title" data-testid="title">
        Title
      </CardTitle>
    );
    expect(screen.getByTestId("title").className).toContain("custom-title");
  });
});

describe("CardDescription", () => {
  it("renders children", () => {
    render(<CardDescription>Description text</CardDescription>);
    expect(screen.getByText("Description text")).toBeInTheDocument();
  });

  it("applies data-slot attribute", () => {
    render(<CardDescription data-testid="desc">Desc</CardDescription>);
    expect(screen.getByTestId("desc")).toHaveAttribute(
      "data-slot",
      "card-description"
    );
  });

  it("applies muted text classes", () => {
    render(<CardDescription data-testid="desc">Desc</CardDescription>);
    const desc = screen.getByTestId("desc");
    expect(desc.className).toContain("text-muted-foreground");
    expect(desc.className).toContain("text-sm");
  });

  it("allows custom className", () => {
    render(
      <CardDescription className="custom-desc" data-testid="desc">
        Desc
      </CardDescription>
    );
    expect(screen.getByTestId("desc").className).toContain("custom-desc");
  });
});

describe("CardAction", () => {
  it("renders children", () => {
    render(<CardAction>Action</CardAction>);
    expect(screen.getByText("Action")).toBeInTheDocument();
  });

  it("applies data-slot attribute", () => {
    render(<CardAction data-testid="action">Action</CardAction>);
    expect(screen.getByTestId("action")).toHaveAttribute(
      "data-slot",
      "card-action"
    );
  });

  it("applies grid positioning classes", () => {
    render(<CardAction data-testid="action">Action</CardAction>);
    const action = screen.getByTestId("action");
    expect(action.className).toContain("col-start-2");
    expect(action.className).toContain("row-span-2");
  });

  it("allows custom className", () => {
    render(
      <CardAction className="custom-action" data-testid="action">
        Action
      </CardAction>
    );
    expect(screen.getByTestId("action").className).toContain("custom-action");
  });
});

describe("CardContent", () => {
  it("renders children", () => {
    render(<CardContent>Main content</CardContent>);
    expect(screen.getByText("Main content")).toBeInTheDocument();
  });

  it("applies data-slot attribute", () => {
    render(<CardContent data-testid="content">Content</CardContent>);
    expect(screen.getByTestId("content")).toHaveAttribute(
      "data-slot",
      "card-content"
    );
  });

  it("applies padding classes", () => {
    render(<CardContent data-testid="content">Content</CardContent>);
    expect(screen.getByTestId("content").className).toContain("px-6");
  });

  it("allows custom className", () => {
    render(
      <CardContent className="custom-content" data-testid="content">
        Content
      </CardContent>
    );
    expect(screen.getByTestId("content").className).toContain("custom-content");
  });
});

describe("CardFooter", () => {
  it("renders children", () => {
    render(<CardFooter>Footer content</CardFooter>);
    expect(screen.getByText("Footer content")).toBeInTheDocument();
  });

  it("applies data-slot attribute", () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    expect(screen.getByTestId("footer")).toHaveAttribute(
      "data-slot",
      "card-footer"
    );
  });

  it("applies flex layout classes", () => {
    render(<CardFooter data-testid="footer">Footer</CardFooter>);
    const footer = screen.getByTestId("footer");
    expect(footer.className).toContain("flex");
    expect(footer.className).toContain("items-center");
    expect(footer.className).toContain("px-6");
  });

  it("allows custom className", () => {
    render(
      <CardFooter className="custom-footer" data-testid="footer">
        Footer
      </CardFooter>
    );
    expect(screen.getByTestId("footer").className).toContain("custom-footer");
  });
});

describe("Card composition", () => {
  it("renders complete card structure", () => {
    render(
      <Card data-testid="card">
        <CardHeader>
          <CardTitle>Title</CardTitle>
          <CardDescription>Description</CardDescription>
          <CardAction>Action</CardAction>
        </CardHeader>
        <CardContent>Content</CardContent>
        <CardFooter>Footer</CardFooter>
      </Card>
    );

    expect(screen.getByTestId("card")).toBeInTheDocument();
    expect(screen.getByText("Title")).toBeInTheDocument();
    expect(screen.getByText("Description")).toBeInTheDocument();
    expect(screen.getByText("Action")).toBeInTheDocument();
    expect(screen.getByText("Content")).toBeInTheDocument();
    expect(screen.getByText("Footer")).toBeInTheDocument();
  });
});
