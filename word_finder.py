#!/usr/bin/env python3
"""
Word Combination Finder
Finds combinations of exactly 3 words (5 letters each) that spell out a given string 
using extensive search of words with 5 matching letters.
"""

from collections import Counter
from itertools import combinations
import sys

def load_word_list(filename='valid-wordle-answers.txt'):
    """Load words from the word list file."""
    try:
        with open(filename, 'r') as f:
            words = [word.strip().upper() for word in f.readlines()]
        return words
    except FileNotFoundError:
        print(f"Error: Could not find {filename}")
        return []

def count_matching_letters(word, target_counter):
    """
    Count how many letters in the word match letters in the target.
    Returns the number of matching letters (considering frequency).
    """
    word_counter = Counter(word)
    matches = 0
    
    for letter, word_count in word_counter.items():
        target_count = target_counter.get(letter, 0)
        matches += min(word_count, target_count)
    
    return matches

def check_combination_coverage(words, target_counter):
    """
    Check if a combination of words covers all letters in the target.
    Returns (coverage_percentage, remaining_letters_counter).
    """
    used_letters = Counter()
    for word in words:
        used_letters.update(word)
    
    remaining = target_counter.copy()
    for letter, used_count in used_letters.items():
        if letter in remaining:
            remaining[letter] = max(0, remaining[letter] - used_count)
            if remaining[letter] == 0:
                del remaining[letter]
    
    total_needed = sum(target_counter.values())
    total_remaining = sum(remaining.values())
    coverage = ((total_needed - total_remaining) / total_needed) * 100
    
    return coverage, remaining

def find_word_combination(target_string, words):
    """
    Find combinations of exactly 3 words that spell out the target string 
    using extensive search.
    
    Args:
        target_string: The string to spell out
        words: List of available words
    
    Returns:
        List of (words, coverage) tuples sorted by coverage
    """
    target_string = target_string.upper().replace(' ', '')
    target_counter = Counter(target_string)
    
    print(f"Target string: {target_string}")
    print(f"Target letters: {dict(target_counter)}")
    print(f"Total letters needed: {sum(target_counter.values())}")
    print()
    
    # Find all words that have exactly 5 matching letters
    print("Finding words with 5 matching letters...")
    five_match_words = []
    
    for word in words:
        matches = count_matching_letters(word, target_counter)
        if matches == 5:
            five_match_words.append(word)
    
    print(f"Found {len(five_match_words)} words with exactly 5 matching letters:")
    print(five_match_words[:20], "..." if len(five_match_words) > 20 else "")
    print()
    
    if len(five_match_words) < 3:
        print("Not enough words with 5 matching letters to form a combination!")
        return []
    
    print(f"Searching through {len(five_match_words):,} choose 3 = {len(list(combinations(five_match_words, 3))):,} combinations...")
    print()
    
    # Try all combinations of 3 words
    results = []
    perfect_matches = []
    
    for i, word_combo in enumerate(combinations(five_match_words, 3)):
        coverage, remaining = check_combination_coverage(word_combo, target_counter)
        results.append((list(word_combo), coverage, remaining))
        
        if coverage == 100.0:
            perfect_matches.append((list(word_combo), coverage, remaining))
        
        # Progress indicator for large searches
        if (i + 1) % 10000 == 0:
            print(f"Searched {i + 1:,} combinations...")
    
    # Sort by coverage (best first)
    results.sort(key=lambda x: x[1], reverse=True)
    
    print("="*50)
    print("SEARCH RESULTS:")
    print(f"Total combinations searched: {len(results):,}")
    print(f"Perfect matches (100% coverage): {len(perfect_matches)}")
    print()
    
    # Show all perfect matches
    if perfect_matches:
        print("All perfect matches (100% coverage):")
        for i, (words_combo, coverage, remaining) in enumerate(perfect_matches):
            print(f"{i+1:3d}. {words_combo}")
    else:
        print("No perfect matches found. Top 10 results:")
        for i, (words_combo, coverage, remaining) in enumerate(results[:10]):
            print(f"{i+1:2d}. {words_combo} - {coverage:.1f}% coverage")
            if remaining:
                print(f"    Missing: {dict(remaining)}")
    
    return results

def main():
    """Main function to run the word finder."""
    words = load_word_list()
    if not words:
        return
    
    print(f"Loaded {len(words)} words from word list")
    print()
    
    # Get target string from user or use default
    if len(sys.argv) > 1:
        target = ' '.join(sys.argv[1:])
    else:
        target = input("Enter the string to spell out (or press Enter for 'CHILL EAT THEATRE'): ").strip()
        if not target:
            target = "CHILL EAT THEATRE"
    
    results = find_word_combination(target, words)
    
    if results:
        print("\n" + "="*50)
        print(f"BEST combination for '{target}':")
        best_combo, best_coverage, best_remaining = results[0]
        for i, word in enumerate(best_combo, 1):
            print(f"{i}. {word}")
        print(f"Coverage: {best_coverage:.1f}%")
        if best_remaining:
            print(f"Missing letters: {dict(best_remaining)}")

if __name__ == "__main__":
    main()