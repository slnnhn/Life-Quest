"""
Simple script to create placeholder icons for Life Quest Chrome Extension
Run this with: python create_icons.py
"""

from PIL import Image, ImageDraw, ImageFont
import os

# Create icons directory if it doesn't exist
os.makedirs('icons', exist_ok=True)

# Define icon sizes
sizes = [16, 32, 48, 128]

# Create icons for each size
for size in sizes:
    # Create a new image with gradient-like purple background
    img = Image.new('RGB', (size, size), color='#667eea')
    draw = ImageDraw.Draw(img)

    # Draw a simple checkmark or quest symbol
    if size >= 32:
        # Draw a white circle background
        padding = size // 6
        draw.ellipse([padding, padding, size-padding, size-padding], fill='white')

        # Draw a simple checkmark
        if size >= 48:
            line_width = max(2, size // 16)
            # Checkmark
            check_points = [
                (size * 0.3, size * 0.5),
                (size * 0.45, size * 0.65),
                (size * 0.7, size * 0.35)
            ]
            draw.line(check_points[:2], fill='#667eea', width=line_width)
            draw.line(check_points[1:], fill='#667eea', width=line_width)

    # Save the icon
    filename = f'icons/icon{size}.png'
    img.save(filename, 'PNG')
    print(f'Created {filename}')

print('\nAll icons created successfully!')
print('You can now load the extension in Chrome.')
