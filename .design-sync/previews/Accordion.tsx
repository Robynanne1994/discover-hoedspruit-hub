import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "vite_react_shadcn_ts";

export const LodgeFAQ = () => (
  <div style={{ padding: 24, maxWidth: 460 }}>
    <Accordion type="single" collapsible defaultValue="item-1">
      <AccordionItem value="item-1">
        <AccordionTrigger>What are the check-in times?</AccordionTrigger>
        <AccordionContent>
          Check-in is from 14:00 and check-out by 10:00. Early arrivals are
          welcome to enjoy the deck and pool while your suite is prepared.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger>Is the lodge Big-5?</AccordionTrigger>
        <AccordionContent>
          Yes — we border the Greater Kruger, so lion, leopard, elephant, buffalo
          and rhino are all regularly spotted on our guided game drives.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger>Do you allow day visitors?</AccordionTrigger>
        <AccordionContent>
          Day visitors are welcome for lunch and a single afternoon drive by
          prior arrangement. Please book at least 48 hours ahead.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  </div>
);
