#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Bundle Analysis Script
 * 
 * This script analyzes the Next.js build output and provides insights
 * about bundle sizes, optimization opportunities, and performance metrics.
 */

const BUNDLE_SIZE_LIMITS = {
  // Recommended bundle size limits (in KB)
  FIRST_LOAD_JS: 244, // Next.js recommendation
  TOTAL_SIZE: 512,    // Total bundle size warning threshold
  INDIVIDUAL_CHUNK: 128, // Individual chunk size warning
}

const PERFORMANCE_BUDGETS = {
  // Performance budget recommendations
  CRITICAL_RESOURCES: 170, // KB for critical resources
  NON_CRITICAL: 300,       // KB for non-critical resources
  IMAGES: 500,             // KB for images
}

async function analyzeBundleSize() {
  console.log('📊 Starting Bundle Size Analysis...\n')

  try {
    // Build the application first
    console.log('🔨 Building application for analysis...')
    execSync('npm run build', { stdio: 'inherit' })
    console.log('✅ Build completed successfully\n')

    // Check if .next directory exists
    const nextDir = join(process.cwd(), '.next')
    if (!existsSync(nextDir)) {
      throw new Error('.next directory not found. Build may have failed.')
    }

    // Analyze build output
    console.log('📈 Analyzing build output...\n')
    
    // Get build stats
    const buildStatsPath = join(nextDir, 'build-manifest.json')
    if (existsSync(buildStatsPath)) {
      const buildStats = JSON.parse(readFileSync(buildStatsPath, 'utf8'))
      console.log('📋 Build Manifest Analysis:')
      console.log(`   Pages: ${Object.keys(buildStats.pages || {}).length}`)
      console.log(`   Static files: ${Object.keys(buildStats.devFiles || []).length}`)
    }

    // Check for common optimization opportunities
    console.log('\n🔍 Optimization Opportunities:')
    
    const recommendations = []
    
    // Check for large dependencies
    const packageJson = JSON.parse(readFileSync('package.json', 'utf8'))
    const dependencies = { ...packageJson.dependencies, ...packageJson.devDependencies }
    
    const largeDependencies = [
      '@supabase/supabase-js',
      'react',
      'react-dom',
      'next',
      '@radix-ui/react-dialog',
      'lucide-react'
    ]
    
    largeDependencies.forEach(dep => {
      if (dependencies[dep]) {
        console.log(`   📦 ${dep}: ${dependencies[dep]}`)
      }
    })
    
    // Recommendations based on dependencies
    if (dependencies['@supabase/supabase-js']) {
      recommendations.push('Consider using Supabase client-side only where needed')
    }
    
    if (dependencies['lucide-react']) {
      recommendations.push('Use tree-shaking for Lucide React icons (import specific icons)')
    }
    
    if (Object.keys(dependencies).filter(dep => dep.startsWith('@radix-ui')).length > 5) {
      recommendations.push('Consider bundling Radix UI components or using a single package')
    }

    console.log('\n💡 Optimization Recommendations:')
    recommendations.forEach((rec, index) => {
      console.log(`   ${index + 1}. ${rec}`)
    })

    // Performance budget check
    console.log('\n⚡ Performance Budget Guidelines:')
    console.log(`   Critical Resources: < ${PERFORMANCE_BUDGETS.CRITICAL_RESOURCES}KB`)
    console.log(`   Non-Critical Resources: < ${PERFORMANCE_BUDGETS.NON_CRITICAL}KB`)
    console.log(`   Images: < ${PERFORMANCE_BUDGETS.IMAGES}KB`)
    console.log(`   First Load JS: < ${BUNDLE_SIZE_LIMITS.FIRST_LOAD_JS}KB`)

    console.log('\n🎯 Next Steps:')
    console.log('   1. Run `npm run analyze` to open the bundle analyzer')
    console.log('   2. Check for unused dependencies with `npx depcheck`')
    console.log('   3. Use `npm run build` to see detailed bundle sizes')
    console.log('   4. Consider code splitting for large components')
    console.log('   5. Optimize images and use Next.js Image component')

  } catch (error) {
    console.error('❌ Bundle analysis failed:', error.message)
    process.exit(1)
  }
}

async function checkDependencies() {
  console.log('\n🔍 Dependency Analysis:')
  
  try {
    // Check for unused dependencies
    console.log('   Checking for unused dependencies...')
    execSync('npx depcheck --json > dependency-report.json', { stdio: 'pipe' })
    
    const depReport = JSON.parse(readFileSync('dependency-report.json', 'utf8'))
    
    if (depReport.dependencies && depReport.dependencies.length > 0) {
      console.log('   ⚠️  Unused dependencies found:')
      depReport.dependencies.forEach(dep => {
        console.log(`     - ${dep}`)
      })
    } else {
      console.log('   ✅ No unused dependencies found')
    }
    
    if (depReport.devDependencies && depReport.devDependencies.length > 0) {
      console.log('   ⚠️  Unused dev dependencies found:')
      depReport.devDependencies.forEach(dep => {
        console.log(`     - ${dep}`)
      })
    } else {
      console.log('   ✅ No unused dev dependencies found')
    }
    
  } catch (error) {
    console.log('   ⚠️  Could not run dependency check (depcheck not available)')
    console.log('   💡 Install with: npm install -g depcheck')
  }
}

async function generateOptimizationReport() {
  console.log('\n📄 Generating Optimization Report...')
  
  const report = {
    timestamp: new Date().toISOString(),
    recommendations: [
      {
        category: 'Code Splitting',
        items: [
          'Implement dynamic imports for heavy components',
          'Split vendor bundles by usage frequency',
          'Use Next.js dynamic imports for non-critical components'
        ]
      },
      {
        category: 'Tree Shaking',
        items: [
          'Import only used Lucide React icons',
          'Use specific imports for utility libraries',
          'Remove unused CSS and JavaScript'
        ]
      },
      {
        category: 'Caching Strategy',
        items: [
          'Implement proper cache headers',
          'Use Next.js built-in caching',
          'Consider service worker for offline functionality'
        ]
      },
      {
        category: 'Image Optimization',
        items: [
          'Use Next.js Image component',
          'Implement lazy loading for images',
          'Use modern image formats (WebP, AVIF)'
        ]
      }
    ]
  }
  
  console.log('✅ Optimization categories identified:')
  report.recommendations.forEach(category => {
    console.log(`   📂 ${category.category}:`)
    category.items.forEach(item => {
      console.log(`     • ${item}`)
    })
  })
}

// Main execution
async function runBundleAnalysis() {
  console.log('🚀 Polly Pro Bundle Analysis Tool\n')
  console.log('=' .repeat(50))
  
  try {
    await analyzeBundleSize()
    await checkDependencies()
    await generateOptimizationReport()
    
    console.log('\n' + '='.repeat(50))
    console.log('🎉 Bundle analysis completed successfully!')
    console.log('\n💡 Pro Tip: Run this analysis regularly to maintain optimal bundle size')
    
  } catch (error) {
    console.error('❌ Analysis failed:', error)
    process.exit(1)
  }
}

// Check if this script is being run directly
if (process.argv[1].endsWith('bundle-analysis.js')) {
  runBundleAnalysis()
}

export {
  analyzeBundleSize,
  checkDependencies,
  generateOptimizationReport
}