import { Avatar, AvatarImage, AvatarFallback } from "vite_react_shadcn_ts";

const Wrap = ({ children }: { children: React.ReactNode }) => (
  <div style={{ padding: 24, display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
    {children}
  </div>
);

export const Fallbacks = () => (
  <Wrap>
    <Avatar>
      <AvatarFallback>RM</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>TJ</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarFallback>BK</AvatarFallback>
    </Avatar>
  </Wrap>
);

export const WithImage = () => (
  <Wrap>
    <Avatar>
      <AvatarImage
        src="https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop"
        alt="Lodge host"
      />
      <AvatarFallback>SM</AvatarFallback>
    </Avatar>
    <Avatar>
      <AvatarImage
        src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop"
        alt="Safari guide"
      />
      <AvatarFallback>NG</AvatarFallback>
    </Avatar>
  </Wrap>
);

export const Stack = () => (
  <Wrap>
    <div style={{ display: "flex" }}>
      <Avatar style={{ marginRight: -10, border: "2px solid #dcd4c0" }}>
        <AvatarFallback>RM</AvatarFallback>
      </Avatar>
      <Avatar style={{ marginRight: -10, border: "2px solid #dcd4c0" }}>
        <AvatarFallback>TJ</AvatarFallback>
      </Avatar>
      <Avatar style={{ marginRight: -10, border: "2px solid #dcd4c0" }}>
        <AvatarFallback>BK</AvatarFallback>
      </Avatar>
      <Avatar style={{ border: "2px solid #dcd4c0" }}>
        <AvatarFallback>+5</AvatarFallback>
      </Avatar>
    </div>
  </Wrap>
);
