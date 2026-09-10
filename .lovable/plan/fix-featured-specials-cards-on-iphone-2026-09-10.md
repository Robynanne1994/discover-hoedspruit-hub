# Fix Featured Specials Cards on iPhone

## Goal
Remove the extra white space beneath featured special cards on iPhone while keeping every featured image cropped consistently at 3:2.

## Changes
- Stop carousel cards from stretching to match a neighbouring card’s height.
- Let each featured card end immediately after its value bar.
- Keep the image in a fixed 3:2 frame with `object-fit: cover`, so source-image proportions cannot resize the card.
- Preserve existing carousel scrolling, peeking, dots, content, and navigation.

## Validation
- Check the Specials page at the current 393 × 852 mobile viewport.
- Confirm featured cards have no empty white footer area and images remain edge-to-edge within their 3:2 frames.
- Run the relevant project checks.
