
import React from 'react';
import { render, screen } from '@testing-library/react';
import Homepage from '../../src/app/page';
import '@testing-library/jest-dom';

describe('Homepage', () => {
    it('renders the demo link pointing to /shop/demo', () => {
        render(<Homepage />);
        const link = screen.getByRole('link', { name: /see live demo/i });
        expect(link).toBeInTheDocument();
        expect(link).toHaveAttribute('href', '/shop/demo');
    });

    it('renders the hero image with correct src', () => {
        render(<Homepage />);
        const image = screen.getByRole('img', { name: /markitbot AI demo menu/i });
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'https://markitbot.com/demo-menu-hero.png');
    });
});
